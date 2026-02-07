import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseCsvFile } from "@/lib/parse-generic-names";
import { useRef } from "react";

type GenericNameInputProps = {
  value: string;
  onChange: (value: string) => void;
  onFileUpload: (names: string[]) => void;
};

export function GenericNameInput({
  value,
  onChange,
  onFileUpload,
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
      <Label htmlFor="generic-input">Generic name(s)</Label>
      <div className="flex gap-2">
        <div className="flex items-center gap-2 w-full">
          <Input
            id="generic-input"
            placeholder="e.g. ibuprofen or comma/newline separated names"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1"
          />
          <span className="text-sm text-muted-foreground font-medium">or</span>
          <Button
            type="button"
            variant="outline"
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
        </div>
      </div>
    </div>
  );
}
