import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { flattenForDisplay } from "@/hooks/use-fda-query";
import type { FDAFieldName } from "@/lib/fda-fields";
import type { QueryResult } from "@/types";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

type DownloadButtonProps = {
  results: Record<string, QueryResult>;
  disabled: boolean;
  selectedFields: FDAFieldName[];
};

const CSV_TRUNCATE_LIMIT = 50000;

export function DownloadButton({
  results,
  disabled,
  selectedFields,
}: DownloadButtonProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [truncationDetails, setTruncationDetails] = useState<
    Array<{ drug: string; fields: string[] }>
  >([]);

  const handleDownload = () => {
    try {
      const truncationMap = new Map<string, Set<string>>();
      const header = ["Substance", ...selectedFields];
      const rows = Object.entries(results).map(([genericName, result]) => {
        if (result.status === "success" && result.data) {
          const flat = flattenForDisplay(result.data.results, selectedFields);
          return [
            genericName,
            ...selectedFields.map((field) => {
              const rawValue = String(flat[field] ?? "");
              if (rawValue.length > CSV_TRUNCATE_LIMIT) {
                if (!truncationMap.has(genericName)) {
                  truncationMap.set(genericName, new Set());
                }
                truncationMap.get(genericName)?.add(field);
                return rawValue.slice(0, CSV_TRUNCATE_LIMIT);
              }
              return rawValue;
            }),
          ];
        }
        return [genericName, ...selectedFields.map(() => "")];
      });

      const worksheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
      const output = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob([output], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `openFDA-drug-labels-export-${new Date().toISOString()}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      const details = Array.from(truncationMap.entries()).map(
        ([drug, fields]) => ({
          drug,
          fields: Array.from(fields).sort(),
        }),
      );
      setTruncationDetails(details);
      setIsPopoverOpen(details.length > 0);
    } catch (error) {
      console.error("Failed to build CSV download", error);
      toast.error("Failed to generate CSV download");
    }
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" onClick={handleDownload} disabled={disabled}>
          {disabled ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Download
        </Button>
      </PopoverTrigger>
      {truncationDetails.length > 0 && (
        <PopoverContent className="w-[420px]">
          <div className="space-y-2 text-sm">
            <div className="font-medium">
              Downloaded file. Some fields were truncated to 50,000 characters.
            </div>
            <div className="max-h-[260px] space-y-3 overflow-y-auto pr-1">
              {truncationDetails.map(({ drug, fields }) => (
                <div key={drug} className="space-y-1">
                  <div className="font-medium">{drug}</div>
                  <div className="text-muted-foreground">
                    {fields.join(", ")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      )}
    </Popover>
  );
}
