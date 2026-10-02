import { http, HttpResponse } from "msw";

const API = "http://127.0.0.1:5000/api";

export const handlers = [
  http.get(`${API}/auth/me`, () =>
    HttpResponse.json({
      success: true,
      data: {
        id: "u1",
        spotifyId: "s1",
        displayName: "Test User",
        product: "premium",
        profileImage: "",
        country: "GR",
      },
    })
  ),

  http.get(`${API}/spotify/playlists`, () =>
    HttpResponse.json({
      success: true,
      data: {
        playlists: [{ id: "p1", name: "Focus", trackCount: 20, image: "", owner: "you" }],
      },
    })
  ),
];
