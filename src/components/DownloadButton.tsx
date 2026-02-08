import { Button } from "@/components/ui/button";
import { flattenForDisplay } from "@/hooks/use-fda-query";
import type { FDAFieldName } from "@/lib/fda-fields";
import type { QueryResult } from "@/types";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

type DownloadButtonProps = {
  results: Record<string, QueryResult>;
  disabled: boolean;
  selectedFields: FDAFieldName[];
};

export function DownloadButton({
  results,
  disabled,
  selectedFields,
}: DownloadButtonProps) {
  const handleDownload = () => {
    try {
      const header = ["Substance", ...selectedFields];
      const rows = Object.entries(results).map(([genericName, result]) => {
        if (result.status === "success" && result.data) {
          const flat = flattenForDisplay(result.data.results, selectedFields);
          return [
            genericName,
            ...selectedFields.map((field) => flat[field] ?? ""),
          ];
        }
        return [genericName, ...selectedFields.map(() => "")];
      });

      const worksheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Results");

      const output = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const blob = new Blob([output], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "fda-results.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to build Excel download", error);
      toast.error("Failed to generate Excel download");
    }
  };

  return (
    <Button variant="outline" onClick={handleDownload} disabled={disabled}>
      {disabled ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      Download
    </Button>
  );
}
