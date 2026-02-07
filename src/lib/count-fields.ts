import type { FDAFieldName } from "@/lib/fda-fields"
import type { QueryResult } from "@/types"

function flattenKeysAndValues(
  obj: Record<string, unknown>,
  prefix = ""
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (value === null || value === undefined) continue
    if (Array.isArray(value)) {
      out[fullKey] = value.map((v) => String(v)).join(", ")
    } else if (typeof value === "object" && !(value instanceof Date)) {
      Object.assign(
        out,
        flattenKeysAndValues(value as Record<string, unknown>, fullKey)
      )
    } else {
      out[fullKey] = String(value)
    }
  }
  return out
}

function keyMatchesField(key: string, field: string): boolean {
  const normalized = key.replace(/\./g, "_")
  return (
    key === field ||
    normalized === field ||
    key.startsWith(`${field}.`)
  )
}

function labelHasField(
  label: Record<string, unknown>,
  field: FDAFieldName
): boolean {
  const flat = flattenKeysAndValues(label)
  const fieldStr = String(field)
  for (const [key, value] of Object.entries(flat)) {
    if (keyMatchesField(key, fieldStr) && value !== "") return true
  }
  return false
}

export function getFieldCounts(
  results: Record<string, QueryResult>,
  fieldsToCount: FDAFieldName[]
): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const field of fieldsToCount) {
    counts[field] = 0
  }

  for (const result of Object.values(results)) {
    if (result.status !== "success" || !result.data?.results) continue
    const labels = result.data.results as Record<string, unknown>[]
    for (const field of fieldsToCount) {
      const hasField = labels.some((label) =>
        labelHasField(label, field)
      )
      if (hasField) counts[field] += 1
    }
  }

  return counts
}
