import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchSeoSettings,
  putSeoSettings,
  type SeoSettingsPutBody,
} from "./seo-api";

export const SEO_SETTINGS_QUERY_KEY = ["admin", "seo-settings"] as const;

export function useSeoSettings() {
  return useQuery({
    queryKey: SEO_SETTINGS_QUERY_KEY,
    queryFn: fetchSeoSettings,
  });
}

export function useSeoSettingsSave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SeoSettingsPutBody) => putSeoSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SEO_SETTINGS_QUERY_KEY });
    },
  });
}
