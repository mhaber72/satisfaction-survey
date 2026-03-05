import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

interface SortableThProps {
  label: string;
  column: string;
  currentColumn: string | null;
  direction: "asc" | "desc" | null;
  onToggle: (column: string) => void;
  className?: string;
}

export default function SortableTh({ label, column, currentColumn, direction, onToggle, className = "" }: SortableThProps) {
  const isActive = currentColumn === column;

  return (
    <th
      className={`h-12 px-4 text-left align-middle font-medium whitespace-nowrap cursor-pointer select-none hover:bg-muted/30 transition-colors ${className}`}
      onClick={() => onToggle(column)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive && direction === "asc" ? (
          <ArrowUp className="h-3.5 w-3.5" />
        ) : isActive && direction === "desc" ? (
          <ArrowDown className="h-3.5 w-3.5" />
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 opacity-30" />
        )}
      </span>
    </th>
  );
}
