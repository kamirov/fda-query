import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { CheckCircle, Loader2, XCircle } from "lucide-react"
import type { FDAFieldName } from "@/lib/fda-fields"
import {
  flattenForDisplay,
  getAvailableFieldKeys,
  getMissingSelectedFields,
} from "@/hooks/use-fda-query"
import type { QueryResult } from "@/types"

type ResultsAccordionProps = {
  results: Record<string, QueryResult>
  selectedFields: FDAFieldName[] | undefined
  searchTerm?: string
}

function StatusIcon({ status }: { status: QueryResult["status"] }) {
  switch (status) {
    case "querying":
      return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
    case "success":
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case "error":
      return <XCircle className="h-4 w-4 text-destructive" />
    default:
      return null
  }
}

export function ResultsAccordion({
  results,
  selectedFields,
  searchTerm,
}: ResultsAccordionProps) {
  const entries = Object.entries(results)
  if (entries.length === 0) return null

  const firstKey = entries[0]?.[0]
  const highlightTerm = searchTerm?.trim() ?? ""

  return (
    <Accordion
      type="multiple"
      className="w-full"
      defaultValue={firstKey ? [firstKey] : undefined}
    >
      {entries.map(([genericName, result]) => (
        <AccordionItem key={genericName} value={genericName}>
          <AccordionTrigger className="py-4">
            <div className="flex min-w-0 flex-1 items-center justify-start gap-2 text-left">
              <StatusIcon status={result.status} />
              <span className="truncate">
                {renderHighlightedText(genericName, highlightTerm)}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            {result.status === "error" && result.error ? (
              <p className="text-destructive">
                {renderHighlightedText(result.error, highlightTerm)}
              </p>
            ) : result.status === "success" && result.data ? (
              <ResultsTable
                data={result.data.results}
                selectedFields={
                  selectedFields?.length
                    ? selectedFields.map(String)
                    : undefined
                }
                searchTerm={highlightTerm}
              />
            ) : (
              <p className="text-muted-foreground">Loading...</p>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

function ResultsTable({
  data,
  selectedFields,
  searchTerm,
}: {
  data: unknown[] | undefined
  selectedFields?: string[]
  searchTerm: string
}) {
  const rows = flattenForDisplay(data, selectedFields)

  if (Object.keys(rows).length === 0) {
    if (selectedFields && selectedFields.length > 0) {
      const availableKeys = getAvailableFieldKeys(data)
      const missing = getMissingSelectedFields(availableKeys, selectedFields)
      if (availableKeys.length > 0) {
        return (
          <div className="space-y-2 text-muted-foreground">
            <p>
              The fields {missing.join(", ")} are not present in the data.
            </p>
            <p>Available fields are: {availableKeys.join(", ")}.</p>
          </div>
        )
      }
    }
    return <p className="text-muted-foreground">No data to display</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <tbody>
          {Object.entries(rows).map(([field, value]) => (
            <tr key={field} className="border-b">
              <td className="py-2 pr-4 font-medium align-top text-muted-foreground">
                {renderHighlightedText(field, searchTerm)}
              </td>
              <td className="py-2 break-words">
                {renderHighlightedText(value, searchTerm)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function renderHighlightedText(text: string, term: string) {
  if (!term) return text

  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const regex = new RegExp(escaped, "gi")
  const parts = text.split(regex)

  if (parts.length === 1) return text

  const matches = text.match(regex) ?? []

  return (
    <>
      {parts.map((part, index) => {
        const match = matches[index]
        return (
          <span key={`${index}-${part}`}>
            {part}
            {match ? (
              <mark className="rounded-sm bg-primary/20 px-0.5 text-foreground">
                {match}
              </mark>
            ) : null}
          </span>
        )
      })}
    </>
  )
}
