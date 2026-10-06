import axios from "axios";
import { getRedis } from "../config/redis.js";

const LASTFM_API = "https://ws.audioscrobbler.com/2.0/";
const GENRE_CACHE_TTL = 60 * 60 * 24 * 7; // 1 week

/**
 * Fetch top tags for an artist.
 * Cached in Redis for 7 days — genre data rarely changes.
 * Returns an array of lowercase tag strings, filtered to genre-like ones.
 */
export async function getArtistTopTags(artistName, { limit = 5 } = {}) {
  if (!artistName) return [];
  if (!process.env.LASTFM_API_KEY) {
    throw new Error("LASTFM_API_KEY is not configured");
  }

  const redis = getRedis();
  const cacheKey = `genre:artist:${artistName.toLowerCase()}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  try {
    const { data } = await axios.get(LASTFM_API, {
      params: {
        method: "artist.getTopTags",
        artist: artistName,
        api_key: process.env.LASTFM_API_KEY,
        format: "json",
        autocorrect: 1,
      },
      timeout: 6000,
    });

    const tags = (data?.toptags?.tag ?? [])
      .map((t) => t.name.toLowerCase().trim())
      .filter((t) => t && !isStopTag(t))
      .slice(0, limit);

    await redis.setex(cacheKey, GENRE_CACHE_TTL, JSON.stringify(tags));
    return tags;
  } catch (err) {
    // Cache the miss for 1 hour so we don't hammer Last.fm on failures
    await redis.setex(cacheKey, 3600, JSON.stringify([]));
    console.warn(`[lastfm] tags failed for "${artistName}":`, err.message);
    return [];
  }
}

/**
 * Filter out tags that aren't really genres.
 */
function isStopTag(tag) {
  const stop = new Set([
    "favorites",
    "favourite",
    "favourites",
    "favorite",
    "seen live",
    "spotify",
    "love",
    "loved",
    "awesome",
    "cool",
    "beautiful",
    "chill",
    "great",
    "good",
    "amazing",
    "best",
    "wow",
    "under 2000 listeners",
    "male vocalists",
    "female vocalists",
    "british",
    "american",
    "cover",
    "covers",
    "remix",
    "remixes",
  ]);
  return stop.has(tag) || /^\d+$/.test(tag);
}
