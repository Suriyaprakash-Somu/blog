import { PageShell } from "@/components/layout/PageShell";
import { CTAManager } from "@/components/banner/CTAManager";

export default function AboutPage() {
  return (
    <PageShell className="py-12">
      <CTAManager slot="about-top" className="mb-6" />
      <div className="mx-auto max-w-2xl space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight">About Our Blog</h1>
        <p className="text-muted-foreground text-lg">
          A multi-tenant blogging platform built for content creators and teams.
        </p>
        <div className="rounded-xl border bg-card p-6 text-card-foreground shadow">
          <p>
            Create, manage, and publish blog posts with ease. Our platform
            provides tenant isolation and role-based access control so teams can
            collaborate safely on content creation.
          </p>
        </div>
      </div>
      <CTAManager slot="about-bottom" className="mt-6" />
    </PageShell>
  );
}
