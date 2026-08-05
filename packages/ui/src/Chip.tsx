type ChipType = "success" | "warning" | "info";

interface ChipProps {
  label: string;
  type: ChipType;
}

export function Chip({ label, type }: ChipProps) {
  return <span className={`chip chip-${type}`}>{label}</span>;
}
