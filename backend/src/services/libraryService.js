import axios from "axios";
import Track from "../models/Track.js";
import { getRedis } from "../config/redis.js";
import { ensureFreshAccessToken } from "./spotifyService.js";
import { enrichTracksWithAudioFeatures } from "./reccoBeatsService.js";
import { getArtistTopTags } from "./lastfmService.js";
import { trackKey } from "../utils/trackKey.js";

const SPOTIFY_API = "https://api.spotify.com/v1";
const CACHE_TTL_SECONDS = 60 * 60;
const CACHE_VERSION = "v4"; // bumped again — clean start with helper fix
const CONCURRENCY_PLAYLISTS = 5;
const CONCURRENCY_LASTFM = 15;
const MAX_PLAYLISTS = 30;

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

export async function fetchUserLibrary(user, opts = {}) {
  const redis = getRedis();
  const cacheKey = `library:${CACHE_VERSION}:${user.spotifyId}`;

  const overallStart = Date.now();
  console.log(`[timing] === library fetch START (user=${user.spotifyId}) ===`);

  if (!opts.force) {
    const t0 = Date.now();
    const cached = await redis.get(cacheKey);
    console.log(`[timing] cache lookup: ${Date.now() - t0}ms`);

    if (cached) {
      const parsed = JSON.parse(cached);
      console.log(`[timing] === CACHE HIT — returning ${parsed.tracks.length} tracks ===`);
      return {
        tracks: parsed.tracks.map((t) => new Track(t)),
        playlistsByKey: parsed.playlistsByKey,
        playlistCount: parsed.playlistCount,
        skippedCount: parsed.skippedCount,
        cached: true,
      };
    }
    console.log(`[timing] cache MISS — will fetch from scratch`);
  }

  // Stage 1: Auth
  const tAuth = Date.now();
  const accessToken = await ensureFreshAccessToken(user);
  console.log(`[timing] stage 1 (auth): ${Date.now() - tAuth}ms`);

  const headers = { Authorization: `Bearer ${accessToken}` };

  // Stage 2: List owned playlists
  const tListPlaylists = Date.now();
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
  console.log(
    `[timing] stage 2 (list playlists): ${Date.now() - tListPlaylists}ms — ` +
      `${ownedPlaylists.length} owned, ${skipped} skipped`
  );

  // Stage 3: Fetch each playlist's tracks (concurrency-limited)
  const tFetchTracks = Date.now();
  const tracksByKey = new Map();
  const playlistsByKey = {};

  await runWithConcurrency(ownedPlaylists, CONCURRENCY_PLAYLISTS, async (playlist) => {
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
  console.log(
    `[timing] stage 3 (fetch tracks): ${Date.now() - tFetchTracks}ms — ` +
      `${tracksByKey.size} unique tracks`
  );

  const tracksArray = [...tracksByKey.values()];

  // Stage 4: ReccoBeats enrichment
  const tEnrich = Date.now();
  console.log(`[library] enriching ${tracksArray.length} tracks with audio features…`);
  const enrichment = await enrichTracksWithAudioFeatures(tracksArray);
  console.log(
    `[timing] stage 4 (ReccoBeats enrichment): ${Date.now() - tEnrich}ms — ` +
      `${enrichment.enriched}/${tracksArray.length} enriched`
  );

  // Stage 4b: Filter to enriched-only
  const enrichedTracks = tracksArray.filter((t) => t.danceability > 0);
  console.log(
    `[library] filtered to ${enrichedTracks.length}/${tracksArray.length} enriched tracks`
  );

  // Stage 5: Last.fm genre enrichment
  const tGenres = Date.now();
  const artistNames = new Set();
  for (const t of enrichedTracks) {
    if (t.artists) {
      const primary = t.artists.split(",")[0].trim();
      if (primary) artistNames.add(primary);
    }
  }

  console.log(`[library] fetching genres for ${artistNames.size} unique artists…`);
  const genreMap = new Map();
  const artistList = [...artistNames];

  await runWithConcurrency(artistList, CONCURRENCY_LASTFM, async (artist) => {
    const tags = await getArtistTopTags(artist, { limit: 5 });
    if (tags.length > 0) genreMap.set(artist, tags);
  });

  for (const t of enrichedTracks) {
    const primary = t.artists?.split(",")[0]?.trim();
    const tags = primary ? genreMap.get(primary) : null;
    t.genres = tags ? tags.join(", ") : "";
  }

  console.log(
    `[timing] stage 5 (Last.fm genres): ${Date.now() - tGenres}ms — ` +
      `${genreMap.size}/${artistNames.size} artists with tags`
  );

  // Stage 6: Build result + cache
  const result = {
    tracks: enrichedTracks,
    playlistsByKey,
    playlistCount: ownedPlaylists.length,
    skippedCount: skipped,
    cached: false,
  };

  const tCache = Date.now();
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
    console.log(`[timing] stage 6 (cache write): ${Date.now() - tCache}ms`);
  } catch (err) {
    console.warn("[library] cache write failed:", err.message);
  }

  console.log(`[timing] === library fetch COMPLETE — total: ${Date.now() - overallStart}ms ===`);

  return result;
}

export async function invalidateUserLibrary(spotifyId) {
  const redis = getRedis();
  await redis.del(`library:${CACHE_VERSION}:${spotifyId}`);
}
