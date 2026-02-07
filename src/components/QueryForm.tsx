import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useFdaQuery } from "@/hooks/use-fda-query";
import { getFieldCounts, resultHasField } from "@/lib/count-fields";
import {
  DEFAULT_FIELDS_TO_COUNT,
  DEFAULT_FIELDS_TO_DISPLAY,
  type FDAFieldName,
} from "@/lib/fda-fields";
import { parseGenericNames } from "@/lib/parse-generic-names";
import {
  clearPersistedState,
  loadApiKey,
  loadPersistedState,
  saveApiKey,
  savePersistedState,
} from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { QueryResult } from "@/types";
import { Github, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { DownloadButton } from "./DownloadButton";
import { FieldsMultiselect } from "./FieldsMultiselect";
import { GenericNameInput } from "./GenericNameInput";
import { ResultsAccordion } from "./ResultsAccordion";
import { ShareButton } from "./ShareButton";

function parseSubstancesFromUrl(): string[] | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("substances");
    if (!raw) return null;
    const names = decodeURIComponent(raw)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return names.length > 0 ? names : null;
  } catch {
    return null;
  }
}

export function QueryForm() {
  const initialState = useMemo(() => loadPersistedState(), []);
  const substancesFromUrl = useMemo(() => parseSubstancesFromUrl(), []);

  const [apiKey, setApiKey] = useState(() => loadApiKey());
  const [selectedFields, setSelectedFields] = useState<FDAFieldName[]>(
    () => initialState?.selectedFields ?? [],
  );
  const [fieldsToCount, setFieldsToCount] = useState<FDAFieldName[]>(
    () => initialState?.fieldsToCount ?? [],
  );
  const [genericInput, setGenericInput] = useState(() =>
    substancesFromUrl ? "" : (initialState?.genericInput ?? ""),
  );
  const [genericList, setGenericList] = useState<string[]>(
    () => substancesFromUrl ?? initialState?.genericList ?? [],
  );
  const [selectedFilterFields, setSelectedFilterFields] = useState<
    Set<FDAFieldName>
  >(new Set());

  const { results, isQuerying, allFinished, query, reset } = useFdaQuery(
    substancesFromUrl ? undefined : initialState?.results,
  );

  const lastPersistedResultsRef = useRef<Record<string, QueryResult>>(
    substancesFromUrl ? {} : (initialState?.results ?? {}),
  );
  const hasAutoQueriedRef = useRef(false);

  useEffect(() => {
    if (substancesFromUrl && !hasAutoQueriedRef.current) {
      hasAutoQueriedRef.current = true;
      query(substancesFromUrl, apiKey.trim() || undefined);
    }
  }, [substancesFromUrl, apiKey, query]);

  useEffect(() => {
    saveApiKey(apiKey);
  }, [apiKey]);

  useEffect(() => {
    const resultsToSave = allFinished
      ? results
      : lastPersistedResultsRef.current;
    if (allFinished) {
      lastPersistedResultsRef.current = results;
    }
    savePersistedState({
      selectedFields,
      fieldsToCount,
      genericInput,
      genericList,
      results: resultsToSave,
    });
  }, [
    selectedFields,
    fieldsToCount,
    genericInput,
    genericList,
    results,
    allFinished,
  ]);

  const handleQuery = () => {
    const fromInput = parseGenericNames(genericInput);
    const names = genericList.length > 0 ? genericList : fromInput;

    if (names.length === 0) {
      toast.error("Enter at least one generic name or upload a CSV");
      return;
    }

    reset();
    query(names, apiKey.trim() || undefined);
  };

  const handleFileUpload = (names: string[]) => {
    setGenericList(names);
    setGenericInput("");
  };

  const handleInputChange = (value: string) => {
    setGenericInput(value);
    setGenericList([]);
  };

  const handleReset = () => {
    clearPersistedState();
    setSelectedFields([...DEFAULT_FIELDS_TO_DISPLAY]);
    setFieldsToCount([...DEFAULT_FIELDS_TO_COUNT]);
    setGenericInput("");
    setGenericList([]);
    setSelectedFilterFields(new Set());
    reset();
  };

  const toggleFilterField = (field: FDAFieldName) => {
    setSelectedFilterFields((prev) => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  };

  const handleStatCardKeyDown = (
    e: React.KeyboardEvent,
    field: FDAFieldName,
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleFilterField(field);
    }
  };

  const downloadDisabled = Object.keys(results).length === 0 || !allFinished;
  const hasResults = Object.keys(results).length > 0;
  const fieldCounts = useMemo(
    () =>
      allFinished && fieldsToCount.length > 0
        ? getFieldCounts(results, fieldsToCount)
        : null,
    [allFinished, fieldsToCount, results],
  );

  const filteredResults = useMemo(() => {
    if (selectedFilterFields.size === 0) return results;
    return Object.fromEntries(
      Object.entries(results).filter(([, r]) =>
        [...selectedFilterFields].every((f) => resultHasField(r, f)),
      ),
    );
  }, [results, selectedFilterFields]);

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
              placeholder=""
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

          <div className="space-y-2">
            <Label>Fields to count</Label>
            <FieldsMultiselect
              selected={fieldsToCount}
              onChange={setFieldsToCount}
            />
          </div>

          <GenericNameInput
            value={genericInput}
            onChange={handleInputChange}
            onFileUpload={handleFileUpload}
            uploadedCount={genericList.length}
          />

          <div className="flex gap-2">
            <Button onClick={handleQuery} disabled={isQuerying}>
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
        <main className="flex-1 overflow-auto p-4 space-y-4">
          {fieldsToCount.length > 0 && hasResults && (
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
                <CardDescription>
                  Click to filter results by field (multiple filters supported)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!allFinished ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Waiting for all queries to finish…</span>
                  </div>
                ) : fieldCounts ? (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4">
                    {fieldsToCount.map((field) => (
                      <div
                        key={field}
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleFilterField(field)}
                        onKeyDown={(e) => handleStatCardKeyDown(e, field)}
                        className={cn(
                          "flex flex-col items-center justify-center rounded-lg border bg-card p-4 text-center cursor-pointer transition-colors hover:bg-accent",
                          selectedFilterFields.has(field) &&
                            "ring-2 ring-primary bg-primary/10",
                        )}
                      >
                        <span className="text-[10px] text-muted-foreground">
                          {field}
                        </span>
                        <span className="mt-1 text-2xl font-semibold">
                          {fieldCounts[field] ?? 0}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}
          {hasResults ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Results</CardTitle>
                  <div className="flex items-center gap-2">
                    <ShareButton substances={Object.keys(results)} />
                    <DownloadButton
                      results={results}
                      disabled={downloadDisabled}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {selectedFilterFields.size > 0 &&
                Object.keys(filteredResults).length === 0 ? (
                  <p className="text-muted-foreground">
                    No results match the selected field filters.
                  </p>
                ) : (
                  <ResultsAccordion
                    results={filteredResults}
                    selectedFields={
                      selectedFields.length > 0 ? selectedFields : undefined
                    }
                  />
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2 text-muted-foreground">
              <p>
                Search{" "}
                <a
                  href="https://open.fda.gov/apis/drug/label/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
                >
                  openFDA drug labels
                </a>{" "}
                by generic substance names. Choose which fields to display and
                to count, run a query, then view, filter, share, or download the
                results.
              </p>
              <p>Run a query to see results.</p>
            </div>
          )}
        </main>
        <footer className="flex shrink-0 items-center justify-center gap-2 border-t px-4 py-3 text-sm text-muted-foreground">
          <span>Made with love by Andrei Khramtsov</span>
          <a
            href="https://github.com/kamirov/fda-query"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label="GitHub repository"
          >
            <Github className="h-4 w-4" />
          </a>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
