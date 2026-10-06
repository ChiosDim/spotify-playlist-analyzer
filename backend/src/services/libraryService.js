import axios from "axios";
import Track from "../models/Track.js";
import { getRedis } from "../config/redis.js";
import { ensureFreshAccessToken } from "./spotifyService.js";
import { enrichTracksWithAudioFeatures } from "./reccoBeatsService.js";

const SPOTIFY_API = "https://api.spotify.com/v1";
const CACHE_TTL_SECONDS = 60 * 60; // 1 hour
const CONCURRENCY = 3; // max parallel playlist fetches
const MAX_PLAYLISTS = 30; // cap to avoid rate limits

/**
 * Stable key for deduplication and mapping — matches the logic used elsewhere.
 */
function trackKey(track) {
  if (track.uri) return track.uri;
  return `${track.name.toLowerCase()}|${track.artists.toLowerCase()}`;
}

/**
 * Simple concurrency limiter (like p-limit, no dependency).
 */
async function runWithConcurrency(items, limit, fn) {
  const results = [];
  const executing = new Set();

  for (const item of items) {
    const p = Promise.resolve().then(() => fn(item));
    results.push(p);
    executing.add(p);
    p.finally(() => executing.delete(p));
    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }
  return Promise.all(results);
}

/**
 * Fetch all tracks from a single playlist (paged).
 * Skips curated playlists that would 403.
 */
async function fetchOnePlaylistTracks(accessToken, playlistId) {
  const headers = { Authorization: `Bearer ${accessToken}` };
  const tracks = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const { data } = await axios.get(
      `${SPOTIFY_API}/playlists/${encodeURIComponent(playlistId)}/items`,
      { headers, params: { offset, limit, additional_types: "track" } }
    );

    for (const item of data.items ?? []) {
      const t = item?.item ?? item?.track;
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
    if (offset >= data.total) break;
  }

  return tracks;
}

/**
 * Fetch the user's full library: every owned playlist's tracks,
 * deduplicated, with a map tracking which playlists each track appears in.
 *
 * Result is cached in Redis for 1 hour.
 *
 * @param {object} user - Mongoose User doc
 * @param {{ force?: boolean }} [opts]
 * @returns {Promise<{ tracks: Track[], playlistsByKey: Object, playlistCount: number, skippedCount: number, cached: boolean }>}
 */
export async function fetchUserLibrary(user, opts = {}) {
  const redis = getRedis();
  const cacheKey = `library:${user.spotifyId}`;

  if (!opts.force) {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        tracks: parsed.tracks.map((t) => new Track(t)),
        playlistsByKey: parsed.playlistsByKey,
        playlistCount: parsed.playlistCount,
        skippedCount: parsed.skippedCount,
        cached: true,
      };
    }
  }

  const accessToken = await ensureFreshAccessToken(user);
  const headers = { Authorization: `Bearer ${accessToken}` };

  // 1. List all playlists (paginated), keep only owned ones
  const ownedPlaylists = [];
  let skipped = 0;
  let offset = 0;
  const limit = 50;

  while (ownedPlaylists.length < MAX_PLAYLISTS) {
    const { data } = await axios.get(`${SPOTIFY_API}/me/playlists`, {
      headers,
      params: { offset, limit },
    });

    for (const p of data.items ?? []) {
      if (p.owner?.id !== user.spotifyId) {
        skipped++;
        continue;
      }
      ownedPlaylists.push(p);
      if (ownedPlaylists.length >= MAX_PLAYLISTS) break;
    }

    offset += limit;
    if (offset >= data.total || data.items?.length === 0) break;
  }

  // 2. Fetch each playlist's tracks (concurrency-limited)
  const tracksByKey = new Map();
  const playlistsByKey = {};

  await runWithConcurrency(ownedPlaylists, CONCURRENCY, async (playlist) => {
    try {
      const tracks = await fetchOnePlaylistTracks(accessToken, playlist.id);
      for (const track of tracks) {
        const key = trackKey(track);
        if (!tracksByKey.has(key)) tracksByKey.set(key, track);
        if (!playlistsByKey[key]) playlistsByKey[key] = [];
        if (!playlistsByKey[key].includes(playlist.name)) {
          playlistsByKey[key].push(playlist.name);
        }
      }
    } catch (err) {
      console.warn(`[library] failed to fetch "${playlist.name}":`, err.message);
      skipped++;
    }
  });

  // Enrich with ReccoBeats audio features so similarity comparison works.
  // Cache stores the enriched version so future requests skip this step.
  console.log(`[library] enriching ${tracksByKey.size} tracks with audio features…`);
  const tracksArray = [...tracksByKey.values()];
  const enrichment = await enrichTracksWithAudioFeatures(tracksArray);
  console.log(`[library] enriched ${enrichment.enriched}/${tracksArray.length} tracks`);

  const result = {
    tracks: tracksArray,
    playlistsByKey,
    playlistCount: ownedPlaylists.length,
    skippedCount: skipped,
    cached: false,
  };

  // 3. Cache (without the `cached` field)
  try {
    await redis.setex(
      cacheKey,
      CACHE_TTL_SECONDS,
      JSON.stringify({
        tracks: result.tracks.map((t) => t.toJSON()),
        playlistsByKey: result.playlistsByKey,
        playlistCount: result.playlistCount,
        skippedCount: result.skippedCount,
      })
    );
  } catch (err) {
    console.warn("[library] cache write failed:", err.message);
  }

  return result;
}

/**
 * Invalidate a user's cached library. Call after major changes.
 */
export async function invalidateUserLibrary(spotifyId) {
  const redis = getRedis();
  await redis.del(`library:${spotifyId}`);
}
