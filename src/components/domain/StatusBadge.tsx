import type { CourseStatus } from "../../types/learning";
import { Badge } from "../ui/Badge";

const MAP: Record<CourseStatus, { label: string; tone: "amber" | "cream" | "gold" }> = {
  DRAFT: { label: "Draft", tone: "gold" },
  PUBLISHED: { label: "Dipublikasikan", tone: "amber" },
  ARCHIVED: { label: "Diarsipkan", tone: "cream" },
};

export function StatusBadge({ status }: { status: CourseStatus }) {
  const { label, tone } = MAP[status];
  return <Badge tone={tone} className="px-3 py-1 text-xs">{label}</Badge>;
}
