import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FDA_LABEL_FIELDS, type FDAFieldName } from "@/lib/fda-fields";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

type FieldsMultiselectProps = {
  selected: FDAFieldName[];
  onChange: (selected: FDAFieldName[]) => void;
};

export function FieldsMultiselect({
  selected,
  onChange,
}: FieldsMultiselectProps) {
  const allSelected =
    selected.length === FDA_LABEL_FIELDS.length && FDA_LABEL_FIELDS.length > 0;
  const someSelected = selected.length > 0 && !allSelected;

  const toggle = (field: FDAFieldName) => {
    if (selected.includes(field)) {
      onChange(selected.filter((f) => f !== field));
    } else {
      onChange([...selected, field]);
    }
  };

  const handleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked) {
      onChange([...FDA_LABEL_FIELDS]);
    } else {
      onChange([]);
    }
  };

  const label =
    selected.length === 0
      ? "Select fields to display"
      : `${selected.length} field${selected.length === 1 ? "" : "s"} selected`;

  return (
    <div className="space-y-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              "w-full justify-between font-normal",
              selected.length === 0 && "text-muted-foreground",
            )}
          >
            {label}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <label
            className="flex cursor-pointer items-center gap-2 border-b px-2 py-2 text-sm font-medium hover:bg-accent"
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              checked={allSelected ? true : someSelected ? "indeterminate" : false}
              onCheckedChange={handleSelectAll}
            />
            <span>Select all fields</span>
          </label>
          <div className="max-h-[300px] overflow-y-auto p-2">
            {FDA_LABEL_FIELDS.map((field) => (
              <label
                key={field}
                className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
              >
                <Checkbox
                  checked={selected.includes(field)}
                  onCheckedChange={() => toggle(field)}
                />
                <span className="truncate">{field}</span>
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
