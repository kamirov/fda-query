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
    const data = await fetchByOpenFdaField(
      "substance_name",
      substanceName,
      limit,
      apiKey,
      skip,
    );
    const results = data.results ?? [];
    const hasMatch = results.some((result) =>
      resultMatchesSingleSubstance(result, substanceName),
    );
    if (!hasMatch) {
      const total = data.meta?.results?.total;
      if (typeof total === "number" && total > limit) {
        return await fetchSubstanceNameByPagination(substanceName, apiKey);
      }
      throw new Error("No matches found for substance_name");
    }
    return data;
  } catch (error) {
    if (!isNoMatchesError(error)) {
      throw error;
    }
  }

  return fetchByOpenFdaField("brand_name", substanceName, limit, apiKey, skip);
}

async function fetchByCompoundSubstanceNames(
  parts: string[],
  limit: number,
  apiKey?: string,
  skip?: number,
): Promise<FDALabelResponse> {
  const compoundQuery = parts
    .map((part) => encodeURIComponent(part))
    .join("+AND+");
  const search = `search=openfda.substance_name:(${compoundQuery})`;
  const limitParam = `limit=${limit}`;
  const params = [search, limitParam];
  if (skip !== undefined) {
    params.push(`skip=${skip}`);
  }
  if (apiKey) {
    params.unshift(`api_key=${encodeURIComponent(apiKey)}`);
  }
  const url = `${FDA_API_BASE}?${params.join("&")}`;

  try {
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
      console.error("FDA API compound request failed", {
        parts,
        limit,
        skip,
        error,
      });
    }
    throw error;
  }
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

function resultMatchesSingleSubstance(
  result: FDALabelResult,
  substanceName: string,
): boolean {
  const substances = getSubstanceNames(result);
  if (!Array.isArray(substances) || substances.length !== 1) {
    return false;
  }
  const target = substanceName.toLowerCase();
  return substances.some((s) => s.toLowerCase().includes(target));
}

async function fetchSubstanceNameByPagination(
  substanceName: string,
  apiKey?: string,
): Promise<FDALabelResponse> {
  const limit = 1000;
  let skip = 0;
  let total = Number.POSITIVE_INFINITY;

  while (skip < total) {
    const data = await fetchByOpenFdaField(
      "substance_name",
      substanceName,
      limit,
      apiKey,
      skip,
    );
    const results = data.results ?? [];
    for (const result of results) {
      if (resultMatchesSingleSubstance(result, substanceName)) {
        return {
          meta: { composite: true },
          results: [result],
        };
      }
    }
    const nextTotal = data.meta?.results?.total;
    if (typeof nextTotal === "number") {
      total = nextTotal;
    }
    if (results.length === 0) {
      break;
    }
    skip += limit;
  }

  throw new Error("No matches found for substance_name");
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

  // Paginated search through the compound query
  let skip = 0;
  const limit = COMPOUND_PAGINATION_LIMIT;
  const maxSkip = 25_000;

  while (skip <= maxSkip) {
    let data: FDALabelResponse;
    try {
      data = await fetchByCompoundSubstanceNames(parts, limit, apiKey, skip);
    } catch (error) {
      if (isNoMatchesError(error)) {
        break;
      }
      throw error;
    }
    const batch = data.results ?? [];
    if (batch.length === 0) {
      break;
    }
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
