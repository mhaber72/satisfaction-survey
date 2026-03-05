import { useState, useRef, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

interface MultiSelectFilterProps {
  label: string;
  options: (string | number)[];
  selected: string[];
  onChange: (values: string[]) => void;
  width?: string;
  renderOption?: (value: string | number) => string;
}

export default function MultiSelectFilter({ label, options, selected, onChange, width = "w-[200px]", renderOption }: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const getLabel = (o: string | number) => renderOption ? renderOption(o) : String(o);

  const filtered = options.filter((o) =>
    getLabel(o).toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (val: string) => {
    if (selected.includes(val)) {
      onChange(selected.filter((s) => s !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const displayText = selected.length === 0
    ? label
    : selected.length === 1
      ? String(selected[0])
      : `${selected.length} selected`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`${width} justify-between font-normal h-10`}
        >
          <span className="truncate text-sm">{displayText}</span>
          <div className="flex items-center gap-1 ml-1">
            {selected.length > 0 && (
              <X className="h-3 w-3 opacity-50 hover:opacity-100" onClick={clearAll} />
            )}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-2" align="start" style={{ width: "var(--radix-popover-trigger-width)", minWidth: 220 }}>
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2 h-8 text-sm"
        />
        <div className="flex items-center gap-2 mb-2 px-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs px-2"
            onClick={() => onChange(filtered.map((o) => String(o)))}
          >
            Select all
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs px-2"
            onClick={() => onChange([])}
          >
            Clear all
          </Button>
        </div>
        <div className="max-h-[250px] overflow-y-auto">
          <div className="flex flex-col gap-0.5">
            {filtered.map((opt) => {
              const val = String(opt);
              const isChecked = selected.includes(val);
              return (
                <label
                  key={val}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-muted cursor-pointer text-sm"
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => toggle(val)}
                  />
                  <span className="truncate">{val}</span>
                </label>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">No results</p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
