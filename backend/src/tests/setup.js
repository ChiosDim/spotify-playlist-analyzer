// Runs before every test suite in CI (and locally).
// Provides safe defaults so tests don't crash when .env is missing.

process.env.NODE_ENV ||= "test";
process.env.PORT ||= "5000";
process.env.FRONTEND_URL ||= "http://127.0.0.1:5173";
process.env.SESSION_SECRET ||= "test-session-secret-do-not-use-in-production";

process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/test";
process.env.REDIS_URL ||= "redis://127.0.0.1:6379";

process.env.SPOTIFY_CLIENT_ID ||= "test-client-id";
process.env.SPOTIFY_CLIENT_SECRET ||= "test-client-secret";
process.env.SPOTIFY_REDIRECT_URI ||= "http://127.0.0.1:5000/api/auth/spotify/callback";

process.env.LASTFM_API_KEY ||= "test-lastfm-key";
process.env.SENTRY_DSN ||= "";
