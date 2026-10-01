import { useMutation } from "@tanstack/react-query";
import { analyzeApi } from "../api/client";

export function useDuplicates() {
  return useMutation({ mutationFn: analyzeApi.duplicates });
}
