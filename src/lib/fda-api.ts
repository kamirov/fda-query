import type { FDALabelResponse, FDALabelResult } from "@/types";
import {
  COMPOUND_QUERY_LIMIT,
  DEFAULT_LIMIT,
  FDA_API_BASE,
} from "./constants";

async function fetchBySubstanceName(
  substanceName: string,
  limit: number,
  apiKey?: string,
): Promise<FDALabelResponse> {
  const search = `search=openfda.substance_name:${encodeURIComponent(substanceName)}`;
  const limitParam = `limit=${limit}`;
  const params = [search, limitParam];
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

function getSubstanceNames(result: FDALabelResult): string[] | undefined {
  const openfda = result.openfda as { substance_name?: string[] } | undefined;
  return openfda?.substance_name;
}

export async function fetchCompoundDrugLabel(
  compoundName: string,
  apiKey?: string,
): Promise<FDALabelResponse> {
  const parts = compoundName
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    throw new Error("Compound name is empty or contains only separators");
  }

  const firstPart = parts[0]!;
  const data = await fetchBySubstanceName(
    firstPart,
    COMPOUND_QUERY_LIMIT,
    apiKey,
  );

  const results = data.results ?? [];
  for (const result of results) {
    const substances = getSubstanceNames(result);
    if (!Array.isArray(substances) || substances.length !== parts.length) {
      continue;
    }
    const allMatch = parts.every((part) =>
      substances.some((s) =>
        s.toLowerCase().includes(part.toLowerCase()),
      ),
    );
    if (allMatch) {
      return { ...data, results: [result] };
    }
  }

  throw new Error(
    `No matching label found with exactly ${parts.length} substance(s)`,
  );
}

export async function fetchDrugLabel(
  genericName: string,
  apiKey?: string,
): Promise<FDALabelResponse> {
  if (genericName.includes(";")) {
    return fetchCompoundDrugLabel(genericName, apiKey);
  }

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
