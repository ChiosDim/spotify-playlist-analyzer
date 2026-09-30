import "dotenv/config";
import passport from "passport";
import { Strategy as SpotifyStrategy } from "passport-spotify";
import User from "../models/User.js";
import { upsertUserFromSpotify } from "../services/spotifyService.js";

/**
 * Called once at app startup.
 */
export function configurePassport() {
  passport.use(
    new SpotifyStrategy(
      {
        clientID: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        callbackURL: process.env.SPOTIFY_REDIRECT_URI,
        scope: [
          "user-read-private",
          "user-read-email",
          "playlist-read-private",
          "playlist-read-collaborative",
        ],
        showDialog: true, // Always show Spotify consent dialog
      },
      async function (accessToken, refreshToken, expiresIn, profile, done) {
        try {
          const user = await upsertUserFromSpotify({
            profile,
            accessToken,
            refreshToken,
            expiresIn,
          });
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  // Only the user's id goes into the session cookie.
  passport.serializeUser((user, done) => done(null, user.id));

  // On each request, rehydrate the full user object from the id.
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  return passport;
}
