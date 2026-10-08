import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://127.0.0.1:5000/api" : "/api");
  
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send/receive the spa.sid cookie on every request
  timeout: 30000,
});

// A second client for long-running operations (library enrichment can take 2+ minutes)
const longRunningApi = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 300000, // 5 minutes
});

// Same interceptor as `api`
longRunningApi.interceptors.response.use(
  (res) => res,
  (err) => {
    const normalized = {
      message: "Something went wrong",
      code: "UNKNOWN",
      status: err.response?.status ?? 0,
      details: err.response?.data?.details,
    };
    if (err.response?.data) {
      normalized.message = err.response.data.error || normalized.message;
      normalized.code = err.response.data.code || normalized.code;
    } else if (err.code === "ECONNABORTED") {
      normalized.message = "Request timed out — the library fetch is still running on the server";
      normalized.code = "TIMEOUT";
    } else if (!err.response) {
      normalized.message = "Cannot reach server";
      normalized.code = "NETWORK_ERROR";
    }
    if (normalized.status === 401) {
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }
    return Promise.reject(normalized);
  }
);
/* ------------------------------------------------------------------ */
/* Response interceptor: normalize errors into a single shape         */
/* ------------------------------------------------------------------ */

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const normalized = {
      message: "Something went wrong",
      code: "UNKNOWN",
      status: err.response?.status ?? 0,
      details: err.response?.data?.details,
    };

    if (err.response?.data) {
      // Our backend returns { success: false, error, code, details? }
      normalized.message = err.response.data.error || normalized.message;
      normalized.code = err.response.data.code || normalized.code;
    } else if (err.code === "ECONNABORTED") {
      normalized.message = "Request timed out";
      normalized.code = "TIMEOUT";
    } else if (!err.response) {
      normalized.message = "Cannot reach server";
      normalized.code = "NETWORK_ERROR";
    }

    // 401 during a protected request → emit a browser event so AuthProvider can react
    if (normalized.status === 401) {
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }

    return Promise.reject(normalized);
  }
);

/* ------------------------------------------------------------------ */
/* Typed helpers                                                      */
/* ------------------------------------------------------------------ */

export const apiGet = (url, config) => api.get(url, config).then((r) => r.data.data);
export const apiPost = (url, body, config) => api.post(url, body, config).then((r) => r.data.data);

/* Auth */
export const authApi = {
  me: () => apiGet("/auth/me"),
  logout: () => apiPost("/auth/logout"),
  spotifyLoginUrl: () => `${API_URL}/auth/spotify`,
};

export const analyzeApi = {
  upload: (file) => {
    const form = new FormData();
    form.append("playlist", file);
    return apiPost("/analyze", form);
  },
  duplicates: (file) => {
    const form = new FormData();
    form.append("playlist", file);
    return apiPost("/duplicates", form);
  },
  compare: (files) => {
    const form = new FormData();
    files.forEach((f) => form.append("playlists", f));
    return apiPost("/compare", form);
  },
  similarTracks: (file, { minScore = 0.5, perTrack = 2 } = {}) => {
    const form = new FormData();
    form.append("playlist", file);
    return apiPost(`/similar-tracks?minScore=${minScore}&perTrack=${perTrack}`, form);
  },
  discoverCSV: (file, { seedCount = 10, perSeed = 10, limit = 40 } = {}) => {
    const form = new FormData();
    form.append("playlist", file);
    return apiPost(
      `/discover?source=csv&seedCount=${seedCount}&perSeed=${perSeed}&limit=${limit}`,
      form
    );
  },
};

/* Spotify */
export const spotifyApi = {
  playlists: () => apiGet("/spotify/playlists"),
  analyze: (playlistId, include = "features") =>
    apiPost("/spotify/analyze", { playlistId, include }),
  similarFromLibrary: (playlistId, { minScore = 0.7, perSource = 3, limit = 40 } = {}) =>
    longRunningApi
      .post("/spotify/similar-from-library", {
        playlistId,
        minScore,
        perSource,
        limit,
      })
      .then((r) => r.data.data),
  similarTracks: (playlistId, { minScore = 0.55, perTrack = 2 } = {}) =>
    apiPost("/spotify/similar-tracks", { playlistId, minScore, perTrack }),
  discoverSpotify: ({ playlistId, seedCount = 10, perSeed = 10, limit = 40 }) =>
    longRunningApi
      .post("/discover", {
        source: "spotify",
        playlistId,
        seedCount,
        perSeed,
        limit,
      })
      .then((r) => r.data.data),
};
