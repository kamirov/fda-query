import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { parseCsvFile } from "@/lib/parse-generic-names";
import { HelpCircle } from "lucide-react";
import { useRef } from "react";

type GenericNameInputProps = {
  value: string;
  onChange: (value: string) => void;
  onFileUpload: (names: string[]) => void;
  /** Number of substances from the last CSV upload; shown under the button when > 0 */
  uploadedCount?: number;
};

export function GenericNameInput({
  value,
  onChange,
  onFileUpload,
  uploadedCount = 0,
}: GenericNameInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const names = parseCsvFile(text);
      if (names.length > 0) onFileUpload(names);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Label htmlFor="generic-input">Substance name(s)</Label>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="rounded-full bg-muted p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Help with substance name format"
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-3 text-sm">
              <p className="font-medium">Formatting substance names</p>
              <p className="text-muted-foreground">
                Use <kbd className="rounded bg-muted px-1 font-mono">,</kbd> to
                separate different substances. Use{" "}
                <kbd className="rounded bg-muted px-1 font-mono">;</kbd> to
                separate substances within a compound drug. This applies to both
                the text input and CSV upload.
              </p>
              <div className="space-y-2">
                <p className="font-medium text-foreground">Examples</p>
                <ul className="space-y-3 text-muted-foreground list-disc list-inside">
                  <li>
                    Multiple drugs:{" "}
                    <code className="text-xs">ibuprofen, acetaminophen</code>
                  </li>
                  <li>
                    Compound drug:{" "}
                    <code className="text-xs">acetaminophen; ibuprofen</code>
                  </li>
                  <li>
                    Mix:{" "}
                    <code className="text-xs">
                      aspirin, acetaminophen; caffeine
                    </code>
                  </li>
                </ul>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex gap-2">
        <div className="flex flex-col gap-2 w-full">
          <Input
            id="generic-input"
            placeholder="e.g. ibuprofen or comma/newline separated names"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full"
          />
          <div className="w-full flex justify-center">
            <span className="font-bold text-muted-foreground text-xs">or</span>
          </div>
          <div className="w-full">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload CSV
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
            {uploadedCount > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {uploadedCount} substance{uploadedCount === 1 ? "" : "s"} in
                list
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
