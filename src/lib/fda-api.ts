import type { FDALabelResponse } from "@/types";
import { DEFAULT_LIMIT, FDA_API_BASE } from "./constants";

export async function fetchDrugLabel(
  genericName: string,
  apiKey?: string,
): Promise<FDALabelResponse> {
  const search = `search=openfda.generic_name:${encodeURIComponent(genericName)}`;
  const limit = `limit=${DEFAULT_LIMIT}`;
  const params = [search, limit];
  if (apiKey) {
    params.unshift(`api_key=${encodeURIComponent(apiKey)}`);
  }
  const url = `${FDA_API_BASE}?${params.join("&")}`;

  const res = await fetch(url);
  const data = (await res.json()) as FDALabelResponse;

  if (!res.ok) {
    const message = data.error?.message ?? `HTTP ${res.status}`;
    throw new Error(message);
  }

  if (data.error) {
    throw new Error(data.error.message ?? "Unknown API error");
  }

  return data;
}
