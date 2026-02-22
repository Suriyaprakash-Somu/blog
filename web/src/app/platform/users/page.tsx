import { PageShell } from "@/components/layout/PageShell";
import { ManagePlatformUsersPage } from "@/modules/platform/users/ManageUsersPage";

export default function Page() {
  return (
    <PageShell>
      <ManagePlatformUsersPage />
    </PageShell>
  );
}
