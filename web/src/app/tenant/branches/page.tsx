import { ManageBranchesPage } from "@/modules/tenant/branches";
import { PageShell } from "@/components/layout/PageShell";

export default function BranchesPage() {
  return (
    <PageShell>
      <ManageBranchesPage />
    </PageShell>
  );
}
