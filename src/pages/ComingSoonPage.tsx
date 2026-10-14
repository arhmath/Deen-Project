import { Link } from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";
import { EmptyState } from "../components/ui/EmptyState";
import { Button } from "../components/ui/Button";
import { SparkleIcon } from "../components/landing/DecorativeIcons";

/** Placeholder untuk modul yang belum dibangun, supaya menu tidak mengarah ke 404. */
export default function ComingSoonPage({ title, description }: { title: string; description: string }) {
  return (
    <>
      <PageHeader title={title} />
      <EmptyState
        icon={<SparkleIcon />}
        title="Segera hadir"
        description={description}
        action={<Link to="/dashboard"><Button size="sm" variant="outline">Kembali ke dashboard</Button></Link>}
      />
    </>
  );
}
