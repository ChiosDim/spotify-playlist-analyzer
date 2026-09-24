/**
 * Track represents a Spotify track with all metadata needed for analysis.
 * Fields match what we get from either:
 *   1. An Exportify CSV export (full audio features included)
 *   2. The Spotify Web API (basic metadata, no audio features)
 *   3. ReccoBeats (estimated audio features)
 *
 * Constructor accepts a "snake_case" object (matches CSV column names)
 * and stores everything as camelCase properties.
 */

export default class Track {
  constructor(data = {}) {
    // Identity
    this.uri = String(data.uri ?? "").trim();
    this.name = String(data.name ?? "").trim();
    this.album = String(data.album ?? "").trim();
    this.artists = String(data.artists ?? "").trim();

    // Descriptive metadata
    this.releaseDate = String(data.releaseDate ?? "").trim();
    this.genres = String(data.genres ?? "").trim();
    this.recordLabel = String(data.recordLabel ?? "").trim();

    // Numeric metadata
    this.durationMs = toInt(data.durationMs);
    this.popularity = toInt(data.popularity);
    this.explicit = Boolean(data.explicit);

    // Audio features (0.0–1.0 unless noted)
    this.danceability = toFloat(data.danceability);
    this.energy = toFloat(data.energy);
    this.key = toInt(data.key); // 0–11 (C=0 … B=11)
    this.loudness = toFloat(data.loudness); // dB (-60 to 0)
    this.mode = toInt(data.mode); // 0=minor, 1=major
    this.speechiness = toFloat(data.speechiness);
    this.acousticness = toFloat(data.acousticness);
    this.instrumentalness = toFloat(data.instrumentalness);
    this.liveness = toFloat(data.liveness);
    this.valence = toFloat(data.valence);
    this.tempo = toFloat(data.tempo); // BPM
    this.timeSignature = toInt(data.timeSignature); // beats per bar
  }

  /**
   * A track is valid for analysis if it has the minimum identifying data.
   */
  isValid() {
    return this.uri.length > 0 && this.name.length > 0 && this.artists.length > 0;
  }

  /**
   * Returns a stable key for de-duplication / comparison.
   * Prefers URI, falls back to normalized name+artist.
   */
  key() {
    if (this.uri) return this.uri;
    return `${this.name.toLowerCase()}|${this.artists.toLowerCase()}`;
  }

  /**
   * Converts the track to a plain object (useful for JSON responses).
   */
  toJSON() {
    return { ...this };
  }

  /**
   * Factory: build a Track from an Exportify CSV row.
   * Column names are the literal header strings Exportify produces.
   */
  static fromCSVRow(row) {
    return new Track({
      uri: row["Track URI"],
      name: row["Track Name"],
      album: row["Album Name"],
      artists: row["Artist Names"],
      releaseDate: row["Release Date"],
      genres: row["Genres"],
      recordLabel: row["Record Label"],
      durationMs: row["Duration (ms)"],
      popularity: row["Popularity"],
      explicit: row["Explicit"]?.toLowerCase() === "true",
      danceability: row["Danceability"],
      energy: row["Energy"],
      key: row["Key"],
      loudness: row["Loudness"],
      mode: row["Mode"],
      speechiness: row["Speechiness"],
      acousticness: row["Acousticness"],
      instrumentalness: row["Instrumentalness"],
      liveness: row["Liveness"],
      valence: row["Valence"],
      tempo: row["Tempo"],
      timeSignature: row["Time Signature"],
    });
  }
}

/* ---------- private helpers ---------- */

function toInt(v) {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : 0;
}

function toFloat(v) {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}