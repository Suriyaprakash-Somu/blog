import { PageShell } from "@/components/layout/PageShell";
import { ManageTenantUsersPage } from "@/modules/tenant/users/ManageUsersPage";

export default function Page() {
  return (
    <PageShell>
      <ManageTenantUsersPage />
    </PageShell>
  );
}
