import { Button } from "@/components/ui/button";
import type { DownloadPayload, QueryResult } from "@/types";
import { Download, Loader2 } from "lucide-react";

type DownloadButtonProps = {
  results: Record<string, QueryResult>;
  disabled: boolean;
};

export function DownloadButton({ results, disabled }: DownloadButtonProps) {
  const handleDownload = () => {
    const payload: DownloadPayload = {};
    for (const [genericName, result] of Object.entries(results)) {
      if (result.status === "success" && result.data) {
        payload[genericName] = { data: result.data };
      } else if (result.status === "error" && result.error) {
        payload[genericName] = { error: result.error };
      }
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fda-results.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" onClick={handleDownload} disabled={disabled}>
      {disabled ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
    </Button>
  );
}
