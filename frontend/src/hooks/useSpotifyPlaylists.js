import { useQuery } from "@tanstack/react-query";
import { spotifyApi } from "../api/client";

export function useSpotifyPlaylists(enabled) {
  return useQuery({
    queryKey: ["spotify", "playlists"],
    queryFn: spotifyApi.playlists,
    enabled,
  });
}