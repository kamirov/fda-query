import { maxConcurrentQueries } from "@/lib/constants";
import { fetchDrugLabel } from "@/lib/fda-api";
import type { QueryResult } from "@/types";
import { useCallback, useState } from "react";

type QueryResults = Record<string, QueryResult>;

export function useFdaQuery(initialResults?: QueryResults) {
  const [results, setResults] = useState<QueryResults>(initialResults ?? {});
  const [isQuerying, setIsQuerying] = useState(false);

  const query = useCallback(async (genericNames: string[], apiKey?: string) => {
    if (genericNames.length === 0) return;

    const initial: QueryResults = {};
    for (const name of genericNames) {
      initial[name] = { status: "pending" };
    }
    setResults(initial);
    setIsQuerying(true);

    let index = 0;

    const runNext = async (): Promise<void> => {
      const currentIndex = index++;
      if (currentIndex >= genericNames.length) return;

      const genericName = genericNames[currentIndex]!;
      setResults((prev) => ({
        ...prev,
        [genericName]: { status: "querying" },
      }));

      try {
        const data = await fetchDrugLabel(genericName, apiKey);
        setResults((prev) => ({
          ...prev,
          [genericName]: { status: "success", data },
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setResults((prev) => ({
          ...prev,
          [genericName]: { status: "error", error: message },
        }));
      } finally {
        await runNext();
      }
    };

    const workers = Array.from(
      { length: Math.min(maxConcurrentQueries, genericNames.length) },
      () => runNext(),
    );
    await Promise.all(workers);

    setIsQuerying(false);
  }, []);

  const allFinished = Object.values(results).every(
    (r) => r.status === "success" || r.status === "error",
  );

  const reset = useCallback(() => setResults({}), []);

  return { results, isQuerying, allFinished, query, reset };
}

function flattenToRecord(
  obj: Record<string, unknown>,
  prefix = "",
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value === null || value === undefined) continue;
    if (Array.isArray(value)) {
      out[fullKey] = value.map((v) => String(v)).join(", ");
    } else if (typeof value === "object" && !(value instanceof Date)) {
      Object.assign(
        out,
        flattenToRecord(value as Record<string, unknown>, fullKey),
      );
    } else {
      out[fullKey] = String(value);
    }
  }
  return out;
}

export function getAvailableFieldKeys(
  results: unknown[] | undefined,
): string[] {
  const firstResult = (Array.isArray(results) ? results[0] : undefined) as
    | Record<string, unknown>
    | undefined;
  if (!firstResult || typeof firstResult !== "object") return [];
  return Object.keys(flattenToRecord(firstResult));
}

function selectedFieldMatchesKey(key: string, selectedField: string): boolean {
  const keyNormalized = key.replace(/\./g, "_");
  return (
    key === selectedField ||
    keyNormalized === selectedField ||
    key.startsWith(`${selectedField}.`)
  );
}

export function getMissingSelectedFields(
  availableKeys: string[],
  selectedFields: string[],
): string[] {
  return selectedFields.filter(
    (f) => !availableKeys.some((k) => selectedFieldMatchesKey(k, f)),
  );
}

export function flattenForDisplay(
  results: unknown[] | undefined,
  selectedFields: string[] | undefined,
): Record<string, string> {
  const firstResult = (Array.isArray(results) ? results[0] : undefined) as
    | Record<string, unknown>
    | undefined;
  if (!firstResult || typeof firstResult !== "object") return {};

  const flat = flattenToRecord(firstResult);

  if (selectedFields && selectedFields.length > 0) {
    const filtered: Record<string, string> = {};
    const fieldSet = new Set(selectedFields);
    for (const [key, value] of Object.entries(flat)) {
      const normalized = key.replace(/\./g, "_");
      if (
        fieldSet.has(key) ||
        fieldSet.has(normalized) ||
        selectedFields.some((f) => key === f || key.startsWith(`${f}.`))
      ) {
        filtered[key] = value;
      }
    }
    return filtered;
  }

  return flat;
}
