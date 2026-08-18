import { useQuery } from "@tanstack/react-query";
import { nominatimSearch } from "../../network/nominatim.ts";

export type NominatimPlace = {
  display_name: string;
  geojson: unknown;
};

export function useNominatimSearch(
  query: string,
  type: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["nominatim", type, query],
    queryFn: async () => {
      const json = await nominatimSearch(query, type);
      if (!Array.isArray(json)) return [] as NominatimPlace[];
      return json as NominatimPlace[];
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
