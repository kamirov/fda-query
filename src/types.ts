export type QueryStatus = "pending" | "querying" | "success" | "error"

export type QueryResult = {
  status: QueryStatus
  data?: FDALabelResponse
  error?: string
}

export type FDALabelResult = Record<string, unknown>

export type FDALabelResponse = {
  meta?: { disclaimer?: string; terms?: string; license?: string; last_updated?: string; results?: unknown }
  results?: FDALabelResult[]
  error?: { code?: string; message?: string }
}

export type DownloadPayload = Record<string, { data?: FDALabelResponse; error?: string }>
