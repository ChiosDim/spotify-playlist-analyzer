import { Router } from "express";
import passport from "passport";

const router = Router();

/**
 * Step 1: redirect the browser to Spotify's consent page.
 */
router.get("/spotify", passport.authenticate("spotify", { session: true }));

/**
 * Step 2: Spotify redirects back here with `code`. Passport exchanges it
 * for tokens via the verify callback and establishes the session.
 */
router.get(
  "/spotify/callback",
  passport.authenticate("spotify", {
    session: true,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=spotify_auth_failed`,
  }),
  (req, res) => {
    // Success — send the user back to the frontend.
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  }
);

/**
 * Return the currently authenticated user (or null).
 * Frontend calls this on app load to hydrate its auth state.
 */
router.get("/me", (req, res) => {
  if (!req.user) {
    return res.status(200).json({ success: true, data: null });
  }
  const u = req.user;
  res.json({
    success: true,
    data: {
      id: u._id,
      spotifyId: u.spotifyId,
      displayName: u.displayName,
      email: u.email,
      country: u.country,
      product: u.product,
      profileImage: u.profileImage,
      followers: u.followers,
    },
  });
});

/**
 * Log out: destroy session + clear cookie.
 */
router.post("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie("spa.sid");
      res.json({ success: true, data: null });
    });
  });
});

export default router;
