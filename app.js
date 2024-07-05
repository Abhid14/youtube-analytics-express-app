const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const { google } = require('googleapis');
const sqlite3 = require('sqlite3').verbose();
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, CALLBACK_URL, SESSION_SECRET } = require('./config');

const app = express();
const db = new sqlite3.Database(':memory:');

// Configure Passport with Google OAuth 2.0
passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: CALLBACK_URL
}, (accessToken, refreshToken, profile, cb) => {
  db.run('INSERT OR REPLACE INTO users (googleId, displayName, accessToken, refreshToken) VALUES (?, ?, ?, ?)', 
         [profile.id, profile.displayName, accessToken, refreshToken], 
         (err) => cb(err, profile));
}));

passport.serializeUser((user, done) => {
  done(null, user.googleId);
});

passport.deserializeUser((id, done) => {
  db.get('SELECT * FROM users WHERE googleId = ?', [id], (err, row) => {
    done(err, row);
  });
});

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(session({ secret: SESSION_SECRET, resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// Create the users table
db.run('CREATE TABLE users (googleId TEXT PRIMARY KEY, displayName TEXT, accessToken TEXT, refreshToken TEXT)');

// Function to refresh access token
async function refreshAccessToken(user) {
  const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, CALLBACK_URL);
  oauth2Client.setCredentials({ refresh_token: user.refreshToken });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    const newAccessToken = credentials.access_token;

    db.run('UPDATE users SET accessToken = ? WHERE googleId = ?', [newAccessToken, user.googleId]);

    return newAccessToken;
  } catch (err) {
    console.error('Error refreshing access token:', err);
    throw err;
  }
}

// Routes
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'https://www.googleapis.com/auth/youtube.readonly'] }));

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
  res.redirect('/dashboard');
});

app.get('/dashboard', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }

  let accessToken = req.user.accessToken;
  const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, CALLBACK_URL);
  oauth2Client.setCredentials({ access_token: accessToken });

  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

  try {
    // Fetch channel details
    const channelResponse = await youtube.channels.list({
      part: 'snippet,contentDetails,statistics',
      mine: true
    });
    const channelData = channelResponse.data.items[0];

    // Fetch the list of videos
    const playlistId = channelData.contentDetails.relatedPlaylists.uploads;
    const videosResponse = await youtube.playlistItems.list({
      part: 'snippet,contentDetails',
      playlistId: playlistId,
      maxResults: 10
    });
    const videos = videosResponse.data.items;

    res.render('dashboard', { profile: req.user, channelData: channelData, videos: videos });
  } catch (err) {
    if (err.code === 401) {  // Unauthorized error, likely due to expired access token
      try {
        accessToken = await refreshAccessToken(req.user);
        oauth2Client.setCredentials({ access_token: accessToken });

        const channelResponse = await youtube.channels.list({
          part: 'snippet,contentDetails,statistics',
          mine: true
        });
        const channelData = channelResponse.data.items[0];

        const playlistId = channelData.contentDetails.relatedPlaylists.uploads;
        const videosResponse = await youtube.playlistItems.list({
          part: 'snippet,contentDetails',
          playlistId: playlistId,
          maxResults: 10
        });
        const videos = videosResponse.data.items;

        res.render('dashboard', { profile: req.user, channelData: channelData, videos: videos });
      } catch (refreshErr) {
        console.error('Error refreshing access token and retrying request:', refreshErr);
        res.status(500).send('Error retrieving YouTube data');
      }
    } else {
      console.error('Error retrieving YouTube data:', err);
      res.status(500).send('Error retrieving YouTube data');
    }
  }
});

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

app.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});
