import axios from "axios";

const RECCOBEATS_API = "https://api.reccobeats.com/v1";

/**
 * ReccoBeats returns features keyed by *its own* track id, mapped from
 * a Spotify track id. We resolve Spotify URI -> ReccoBeats id -> features.
 *
 * Spotify deprecated /audio-features in Nov 2024; ReccoBeats is the
 * community-standard replacement.
 */

function extractSpotifyId(uriOrId) {
  // Accepts "spotify:track:XXXX" or a bare id
  if (!uriOrId) return null;
  const parts = uriOrId.split(":");
  return parts.length === 3 ? parts[2] : uriOrId;
}

/**
 * Resolve ReccoBeats IDs for a list of Spotify track IDs.
 * ReccoBeats accepts up to 50 ids per request.
 * @returns {Promise<Map<string,string>>} spotifyId -> reccobeatsId
 */
export async function resolveReccoBeatsIds(spotifyIds) {
  const map = new Map();
  const chunkSize = 50;

  for (let i = 0; i < spotifyIds.length; i += chunkSize) {
    const chunk = spotifyIds.slice(i, i + chunkSize);
    try {
      const { data } = await axios.get(`${RECCOBEATS_API}/track`, {
        params: { ids: chunk.join(",") },
        timeout: 10_000,
      });

      const items = data?.content ?? data ?? [];
      for (const item of items) {
        // ReccoBeats returns `href` and `id`; map by the Spotify id it
        // was derived from — check for `spotifyId` or fall back to order.
        const spotifyId = item.spotifyId ?? item.spotify_id ?? null;
        if (spotifyId && item.id) map.set(spotifyId, item.id);
      }
    } catch (err) {
      console.warn(`[reccobeats] resolve failed for chunk of ${chunk.length}:`, err.message);
      // Continue — missing features degrade gracefully
    }
  }

  return map;
}

/**
 * Fetch audio features for a list of ReccoBeats IDs.
 * @returns {Promise<Map<string,object>>} reccobeatsId -> features
 */
export async function fetchAudioFeaturesByIds(reccobeatsIds) {
  const map = new Map();
  const chunkSize = 50;

  for (let i = 0; i < reccobeatsIds.length; i += chunkSize) {
    const chunk = reccobeatsIds.slice(i, i + chunkSize);
    try {
      const { data } = await axios.get(`${RECCOBEATS_API}/audio-features`, {
        params: { ids: chunk.join(",") },
        timeout: 10_000,
      });

      const items = data?.content ?? data ?? [];
      for (const item of items) {
        if (item.id) map.set(item.id, item);
      }
    } catch (err) {
      console.warn(`[reccobeats] features failed for chunk of ${chunk.length}:`, err.message);
    }
  }

  return map;
}

/**
 * High-level: enrich an array of Track objects with ReccoBeats features.
 * Mutates the tracks in place (they're plain objects).
 */
export async function enrichTracksWithAudioFeatures(tracks) {
  const spotifyIds = tracks.map((t) => extractSpotifyId(t.uri)).filter(Boolean);

  if (spotifyIds.length === 0) return { enriched: 0, missing: 0 };

  const idMap = await resolveReccoBeatsIds(spotifyIds);
  const reccoIds = [...idMap.values()];

  const featuresById = await fetchAudioFeaturesByIds(reccoIds);

  let enriched = 0;
  for (const track of tracks) {
    const sid = extractSpotifyId(track.uri);
    const rid = idMap.get(sid);
    const f = rid ? featuresById.get(rid) : null;
    if (!f) continue;

    track.danceability = num(f.danceability);
    track.energy = num(f.energy);
    track.key = int(f.key);
    track.loudness = num(f.loudness);
    track.mode = int(f.mode);
    track.speechiness = num(f.speechiness);
    track.acousticness = num(f.acousticness);
    track.instrumentalness = num(f.instrumentalness);
    track.liveness = num(f.liveness);
    track.valence = num(f.valence);
    track.tempo = num(f.tempo);
    track.timeSignature = int(f.timeSignature ?? f.time_signature);

    enriched++;
  }

  return { enriched, missing: tracks.length - enriched };
}

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const int = (v) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : 0);
