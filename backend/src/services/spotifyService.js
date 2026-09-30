import axios from "axios";
import Track from "../models/Track.js";
import { HttpError } from "../utils/HttpError.js";
import User from "../models/User.js";

const SPOTIFY_API = "https://api.spotify.com/v1";
const SPOTIFY_TOKEN = "https://accounts.spotify.com/api/token";

/**
 * Ensure the user's access token is fresh. If expired, refresh it and
 * persist the new one. Returns a valid access token.
 */
export async function ensureFreshAccessToken(user) {
  if (!user.isTokenExpired()) return user.accessToken;

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: user.refreshToken,
  });

  const basic = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");

  try {
    const { data } = await axios.post(SPOTIFY_TOKEN, params.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basic}`,
      },
    });

    await user.updateTokens({
      accessToken: data.access_token,
      refreshToken: data.refresh_token, // Spotify may rotate it
      expiresIn: data.expires_in,
    });

    return data.access_token;
  } catch (err) {
    // Spotify returns `invalid_grant` when the refresh token is expired/revoked.
    // The user must reauthorize.
    if (err.response?.data?.error === "invalid_grant") {
      throw new HttpError(
        401,
        "Spotify session expired. Please log in again.",
        "SPOTIFY_REAUTH_REQUIRED"
      );
    }
    throw err;
  }
}

/**
 * Fetch all tracks from a playlist, paging through /playlists/{id}/tracks.
 * Returns Track objects with basic metadata (no audio features yet).
 */
export async function fetchPlaylistTracks(user, playlistId) {
  const accessToken = await ensureFreshAccessToken(user);
  const headers = { Authorization: `Bearer ${accessToken}` };

  const limit = 300;
  let offset = 0;
  let total;
  const tracks = [];

  do {
    const { data } = await axios.get(
      `${SPOTIFY_API}/playlists/${encodeURIComponent(playlistId)}/tracks`,
      {
        headers,
        params: { offset, limit, additional_types: "track" },
      }
    );

    total = data.total;

    for (const item of data.items) {
      // item.track can be null for local files or unavailable tracks
      const t = item?.track;
      if (!t || !t.uri) continue;

      const track = new Track({
        uri: t.uri,
        name: t.name,
        album: t.album?.name ?? "",
        artists: (t.artists ?? []).map((a) => a.name).join(", "),
        releaseDate: t.album?.release_date ?? "",
        durationMs: t.duration_ms,
        popularity: t.popularity,
        explicit: t.explicit,
      });

      if (track.isValid()) tracks.push(track);
    }

    offset += limit;
  } while (offset < total);

  return tracks;
}

/**
 * Fetch the current user's playlists (first page of 50, most recent).
 */
export async function fetchUserPlaylists(user, { limit = 50 } = {}) {
  const accessToken = await ensureFreshAccessToken(user);
  const { data } = await axios.get(`${SPOTIFY_API}/me/playlists`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: { limit },
  });

  return data.items.map((p) => ({
    id: p.id,
    name: p.name,
    trackCount: p.tracks?.total ?? 0,
    image: p.images?.[0]?.url ?? "",
    owner: p.owner?.display_name ?? "",
  }));
}

/**
 * Persist the user (or return the existing one) after OAuth login.
 * Called from the Passport verify callback.
 */
export async function upsertUserFromSpotify({ profile, accessToken, refreshToken, expiresIn }) {
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  const user = await User.findOneAndUpdate(
    { spotifyId: profile.id },
    {
      $set: {
        displayName: profile.displayName ?? "",
        email: profile.emails?.[0]?.value ?? "",
        country: profile.country ?? "",
        product: profile.product ?? "",
        profileImage: profile.photos?.[0]?.value ?? "",
        followers: profile.followers?.total ?? 0,
        accessToken,
        refreshToken,
        expiresAt,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return user;
}
