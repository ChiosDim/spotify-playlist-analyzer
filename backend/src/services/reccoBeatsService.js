import axios from "axios";

const RECCOBEATS_API = "https://api.reccobeats.com/v1";

/**
 * Extract the Spotify ID from a Track URI.
 * Input:  "spotify:track:6Z0sHILAQuUsmZQ7pMe90N"  →  "6Z0sHILAQuUsmZQ7pMe90N"
 * Accepts a bare ID as a fallback.
 */
function extractSpotifyId(uriOrId) {
  if (!uriOrId) return null;
  const parts = uriOrId.split(":");
  return parts.length === 3 ? parts[2] : uriOrId;
}

/**
 * Extract the Spotify ID from a ReccoBeats `href` field.
 * Input:  "https://open.spotify.com/track/6Z0sHILAQuUsmZQ7pMe90N"  →  "6Z0sHILAQuUsmZQ7pMe90N"
 */
function extractSpotifyIdFromHref(href) {
  if (!href) return null;
  const match = href.match(/\/track\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

export async function resolveReccoBeatsIds(spotifyIds) {
  const map = new Map();
  const chunkSize = 40;

  for (let i = 0; i < spotifyIds.length; i += chunkSize) {
    const chunk = spotifyIds.slice(i, i + chunkSize);
    try {
      const { data } = await axios.get(`${RECCOBEATS_API}/track`, {
        params: { ids: chunk.join(",") },
        timeout: 10_000,
      });

      const items = data?.content ?? data ?? [];

      for (const item of items) {
        const spotifyId = extractSpotifyIdFromHref(item.href) ?? item.spotifyId ?? null;
        if (spotifyId && item.id) {
          map.set(spotifyId, item.id);
        }
      }
    } catch (err) {
      console.warn(`[reccobeats] resolve failed for chunk of ${chunk.length}:`, err.message);
      console.warn(
        "[reccobeats] status:",
        err.response?.status,
        "body:",
        JSON.stringify(err.response?.data)
      );
    }
  }

  return map;
}

export async function fetchAudioFeaturesByIds(reccobeatsIds) {
  const map = new Map();
  const chunkSize = 40;

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
      console.warn(
        "[reccobeats] status:",
        err.response?.status,
        "body:",
        JSON.stringify(err.response?.data)
      );
    }
  }

  return map;
}

export async function enrichTracksWithAudioFeatures(tracks) {
  // Track URIs → Spotify IDs (uses the URI parser)
  const spotifyIds = tracks.map((t) => extractSpotifyId(t.uri)).filter(Boolean);
  if (spotifyIds.length === 0) return { enriched: 0, missing: 0 };

  const idMap = await resolveReccoBeatsIds(spotifyIds);
  const reccoIds = [...idMap.values()];
  const featuresById = await fetchAudioFeaturesByIds(reccoIds);

  let enriched = 0;
  for (const track of tracks) {
    const sid = extractSpotifyId(track.uri); // ← URI parser here too
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
