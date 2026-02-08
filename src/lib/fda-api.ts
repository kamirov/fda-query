import type { FDALabelResponse, FDALabelResult } from "@/types";
import {
  COMPOUND_PAGINATION_LIMIT,
  FDA_API_BASE,
  RESPONSE_LENGTH,
} from "./constants";

type OpenFdaField = "substance_name" | "brand_name";

function isNoMatchesError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.message.toLowerCase().includes("no matches found");
}

async function fetchByOpenFdaField(
  field: OpenFdaField,
  value: string,
  limit: number,
  apiKey?: string,
  skip?: number,
): Promise<FDALabelResponse> {
  try {
    const search = `search=openfda.${field}:"${encodeURIComponent(value)}"`;
    const limitParam = `limit=${limit}`;
    const params = [search, limitParam];
    if (skip !== undefined) {
      params.push(`skip=${skip}`);
    }
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
  } catch (error) {
    if (!isNoMatchesError(error)) {
      console.error("FDA API request failed", {
        field,
        value,
        limit,
        skip,
        error,
      });
    }
    throw error;
  }
}

async function fetchBySubstanceNameWithFallback(
  substanceName: string,
  limit: number,
  apiKey?: string,
  skip?: number,
): Promise<FDALabelResponse> {
  try {
    return await fetchByOpenFdaField(
      "substance_name",
      substanceName,
      limit,
      apiKey,
      skip,
    );
  } catch (error) {
    if (!isNoMatchesError(error)) {
      throw error;
    }
  }

  return fetchByOpenFdaField(
    "brand_name",
    substanceName,
    limit,
    apiKey,
    skip,
  );
}

function extractTotal(data: FDALabelResponse): number {
  const meta = data.meta as { results?: { total?: number } } | undefined;
  return meta?.results?.total ?? 0;
}

function getSubstanceNames(result: FDALabelResult): string[] | undefined {
  const openfda = result.openfda as { substance_name?: string[] } | undefined;
  return openfda?.substance_name;
}

function resultMatchesCompound(
  result: FDALabelResult,
  parts: string[],
): boolean {
  const substances = getSubstanceNames(result);
  if (!Array.isArray(substances) || substances.length !== parts.length) {
    return false;
  }
  return parts.every((part) =>
    substances.some((s) => s.toLowerCase().includes(part.toLowerCase())),
  );
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

  // Count step: fetch total for each substance
  const totals: Record<string, number> = {};
  for (const part of parts) {
    const data = await fetchBySubstanceNameWithFallback(
      part,
      RESPONSE_LENGTH,
      apiKey,
    );
    totals[part] = extractTotal(data);
  }

  console.log("Compound drug counts:", totals);

  const substanceWithLowestTotal = parts.reduce((a, b) =>
    totals[a]! <= totals[b]! ? a : b,
  );
  const total = totals[substanceWithLowestTotal] ?? 0;

  // Paginated search through the substance with lowest total
  let skip = 0;
  const limit = COMPOUND_PAGINATION_LIMIT;
  const maxSkip = 25_000;

  while (skip < total && skip <= maxSkip) {
    const data = await fetchBySubstanceNameWithFallback(
      substanceWithLowestTotal,
      limit,
      apiKey,
      skip,
    );
    const batch = data.results ?? [];
    for (const result of batch) {
      if (resultMatchesCompound(result, parts)) {
        return {
          meta: { composite: true },
          results: [result],
        };
      }
    }
    skip += limit;
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
  return fetchBySubstanceNameWithFallback(genericName, RESPONSE_LENGTH, apiKey);
}
