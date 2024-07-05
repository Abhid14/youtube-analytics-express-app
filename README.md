# YouTube Analytics App

This is a simple YouTube Analytics web application that allows users to sign in with their Google account associated with their YouTube channel. The app retrieves and displays video analytics from the YouTube Data API v3.

## Features

- Google OAuth 2.0 authentication
- Display YouTube channel details
- List videos with details including thumbnails, titles, publish dates, and descriptions

## Prerequisites

- Node.js
- npm
- Google Developer Console project with YouTube Data API v3 enabled

## Setup

### 1. Clone the Repository

```sh
git clone https://github.com/yourusername/youtube-analytics-app.git
cd youtube-analytics-app
```

### 2. Install Dependencies

```sh
npm install
```

### 3. Set Up Google Developer Console

- Go to the Google Cloud Console.
- Create a new project.
- Enable the YouTube Data API v3.
- Set up OAuth 2.0 credentials:
  - Configure the OAuth consent screen.
  - Create an OAuth 2.0 Client ID for a web application.
  - Set `http://localhost:3000` as an authorized JavaScript origin.
  - Set `http://localhost:3000/auth/google/callback` as an authorized redirect URI.
- Copy the client ID and client secret.

### 4. Configure the Application

Create a `config.js` file in the root directory with the following content:

```javascript
module.exports = {
  GOOGLE_CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID',
  GOOGLE_CLIENT_SECRET: 'YOUR_GOOGLE_CLIENT_SECRET',
  CALLBACK_URL: 'http://localhost:3000/auth/google/callback',
  SESSION_SECRET: 'your_secret_key'
};
```

Replace `YOUR_GOOGLE_CLIENT_ID` and `YOUR_GOOGLE_CLIENT_SECRET` with your actual credentials from the Google Developer Console.

### 5. Run the Application

```sh
node app.js
```

Open your web browser and navigate to `http://localhost:3000` to start using the app.

## Project Structure

```
youtube-analytics-app/
├── node_modules/
├── public/
├── views/
│   ├── index.ejs
│   ├── login.ejs
│   └── dashboard.ejs
├── app.js
└── config.js
```

## Usage

- Go to `http://localhost:3000`.
- Click on "Login with Google" to authenticate with your Google account.
- After successful login, you will be redirected to the dashboard where you can see your YouTube channel details and a list of your videos.
