import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { FieldsMultiselect } from "./FieldsMultiselect"
import { GenericNameInput } from "./GenericNameInput"
import { parseGenericNames } from "@/lib/parse-generic-names"
import { useFdaQuery } from "@/hooks/use-fda-query"
import type { FDAFieldName } from "@/lib/fda-fields"
import { ResultsAccordion } from "./ResultsAccordion"
import { DownloadButton } from "./DownloadButton"
import {
  loadApiKey,
  loadPersistedState,
  saveApiKey,
  savePersistedState,
  clearPersistedState,
} from "@/lib/storage"

export function QueryForm() {
  const initialState = useMemo(() => loadPersistedState(), [])

  const [apiKey, setApiKey] = useState(() => loadApiKey())
  const [selectedFields, setSelectedFields] = useState<FDAFieldName[]>(
    () => initialState?.selectedFields ?? []
  )
  const [genericInput, setGenericInput] = useState(
    () => initialState?.genericInput ?? ""
  )
  const [genericList, setGenericList] = useState<string[]>(
    () => initialState?.genericList ?? []
  )

  const { results, isQuerying, allFinished, query, reset } = useFdaQuery(
    initialState?.results
  )

  useEffect(() => {
    saveApiKey(apiKey)
  }, [apiKey])

  useEffect(() => {
    savePersistedState({
      selectedFields,
      genericInput,
      genericList,
      results,
    })
  }, [selectedFields, genericInput, genericList, results])

  const handleQuery = () => {
    const fromInput = parseGenericNames(genericInput)
    const names = genericList.length > 0 ? genericList : fromInput

    if (names.length === 0) {
      toast.error("Enter at least one generic name or upload a CSV")
      return
    }

    reset()
    query(names, apiKey.trim() || undefined)
  }

  const handleFileUpload = (names: string[]) => {
    setGenericList(names)
    setGenericInput("")
  }

  const handleInputChange = (value: string) => {
    setGenericInput(value)
    setGenericList([])
  }

  const handleReset = () => {
    clearPersistedState()
    setSelectedFields([])
    setGenericInput("")
    setGenericList([])
    reset()
  }

  const downloadDisabled = Object.keys(results).length === 0 || !allFinished
  const hasResults = Object.keys(results).length > 0

  return (
    <SidebarProvider>
      <Sidebar variant="inset">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-2">
            <span className="font-semibold">Query openFDA Drug Labels</span>
          </div>
        </SidebarHeader>
        <SidebarContent className="space-y-4 px-4 pb-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key (optional)</Label>
            <Input
              id="api-key"
              type="text"
              placeholder="API Key (optional)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Fields to display</Label>
            <FieldsMultiselect
              selected={selectedFields}
              onChange={setSelectedFields}
            />
          </div>

          <GenericNameInput
            value={genericInput}
            onChange={handleInputChange}
            onFileUpload={handleFileUpload}
          />

          {genericList.length > 0 && (
            <p className="text-sm text-muted-foreground">
              From CSV: {genericList.join(", ")}
            </p>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleQuery}
              disabled={isQuerying}
            >
              Query openFDA
            </Button>
            {hasResults && (
              <Button variant="outline" onClick={handleReset}>
                Reset
              </Button>
            )}
          </div>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <span className="font-semibold">Results</span>
        </header>
        <main className="flex-1 overflow-auto p-4">
          {hasResults ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Results</CardTitle>
                  <DownloadButton results={results} disabled={downloadDisabled} />
                </div>
              </CardHeader>
              <CardContent>
                <ResultsAccordion
                  results={results}
                  selectedFields={selectedFields.length > 0 ? selectedFields : undefined}
                />
              </CardContent>
            </Card>
          ) : (
            <p className="text-muted-foreground">
              Run a query to see results.
            </p>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
