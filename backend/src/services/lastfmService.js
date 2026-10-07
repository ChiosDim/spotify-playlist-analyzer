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

const STOP_TAGS = new Set([
  // Generic popularity / not genre
  "all",
  "my top songs",
  "my top songs 2023",
  "my top songs 2024",
  "my top songs 2025",
  "rutracker",
  "seen live",
  "spotify",
  "favorites",
  "favourites",
  "favorite",
  "favourite",
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
  "under 100 listeners",
  // Demographic / not genre
  "male vocalists",
  "female vocalists",
  "british",
  "american",
  "canadian",
  "irish",
  "australian",
  "swedish",
  "norwegian",
  "danish",
  "german",
  "french",
  "icelandic",
  "swiss",
  "dutch",
  // Regional cities
  "los angeles",
  "new york",
  "seattle",
  "boston",
  "portland",
  "nashville",
  "detroit",
  "chicago",
  // Non-genre personal tags
  "the flourishing zoo",
  "alt z",
  "upcoming album 2022",
  "upcoming album 2024",
  "punk_add_to_lidarr_batch_11",
  "funk_add_to_lidarr_batch_11",
  "need to rate",
]);

function isStopTag(tag) {
  if (STOP_TAGS.has(tag)) return true;
  if (/^\d+$/.test(tag)) return true; // "1985", "70s"
  if (/^\d+s$/.test(tag)) return true; // "60s", "70s", "80s"
  if (tag.split(" ").length > 3) return true; // "the flourishing zoo of whatever"
  return false;
}
