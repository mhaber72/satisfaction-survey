interface ScoreDotProps {
  color: string | null;
}

export function ScoreDot({ color }: ScoreDotProps) {
  if (!color) return null;
  return (
    <span
      className="inline-block w-3 h-3 rounded-full mr-2 flex-shrink-0"
      style={{ backgroundColor: color }}
    />
  );
}
