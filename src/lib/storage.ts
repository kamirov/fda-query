import type { QueryResult } from "@/types"
import type { FDAFieldName } from "@/lib/fda-fields"

export const STORAGE_KEY_API = "fda-query-api-key"
export const STORAGE_KEY_PERSISTED = "fda-query-persisted"

export type PersistedState = {
  selectedFields: FDAFieldName[]
  genericInput: string
  genericList: string[]
  results: Record<string, QueryResult>
}

function isQueryResult(value: unknown): value is QueryResult {
  if (!value || typeof value !== "object") return false
  const obj = value as Record<string, unknown>
  return (
    typeof obj.status === "string" &&
    ["pending", "querying", "success", "error"].includes(obj.status)
  )
}

function isQueryResults(value: unknown): value is Record<string, QueryResult> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  return Object.values(value as Record<string, unknown>).every(isQueryResult)
}

function isFDAFieldName(value: unknown): value is FDAFieldName {
  return typeof value === "string" && value.length > 0
}

function parseResults(raw: unknown): Record<string, QueryResult> {
  if (!isQueryResults(raw)) return {}
  return raw
}

function parseSelectedFields(raw: unknown): FDAFieldName[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(isFDAFieldName)
}

function parseString(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function parseStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((v): v is string => typeof v === "string")
}

export function loadPersistedState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PERSISTED)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object") return null
    return {
      selectedFields: parseSelectedFields(parsed.selectedFields),
      genericInput: parseString(parsed.genericInput),
      genericList: parseStringArray(parsed.genericList),
      results: parseResults(parsed.results),
    }
  } catch {
    return null
  }
}

export function savePersistedState(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY_PERSISTED, JSON.stringify(state))
  } catch (err) {
    console.error("Failed to save persisted state:", err)
  }
}

export function clearPersistedState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_PERSISTED)
  } catch (err) {
    console.error("Failed to clear persisted state:", err)
  }
}

export function loadApiKey(): string {
  try {
    const value = localStorage.getItem(STORAGE_KEY_API)
    return value ?? ""
  } catch {
    return ""
  }
}

export function saveApiKey(value: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_API, value)
  } catch (err) {
    console.error("Failed to save API key:", err)
  }
}
