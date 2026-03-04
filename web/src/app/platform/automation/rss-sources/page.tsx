"use client";

import { PageShell } from "@/components/layout/PageShell";
import { ManageRssSourcesPage } from "@/modules/platform/automation/ManageRssSourcesPage";

export default function Page() {
    return (
        <PageShell>
            <ManageRssSourcesPage />
        </PageShell>
    );
}
