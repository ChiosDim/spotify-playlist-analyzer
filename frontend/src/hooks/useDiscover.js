import { useMutation } from "@tanstack/react-query";
import { analyzeApi, spotifyApi } from "../api/client";

export function useDiscoverCSV() {
  return useMutation({
    mutationFn: ({ file, seedCount, perSeed, limit }) =>
      analyzeApi.discoverCSV(file, { seedCount, perSeed, limit }),
  });
}

export function useDiscoverSpotify() {
  return useMutation({
    mutationFn: ({ playlistId, seedCount, perSeed, limit }) =>
      spotifyApi.discoverSpotify({ playlistId, seedCount, perSeed, limit }),
  });
}
