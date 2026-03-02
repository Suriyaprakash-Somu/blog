import { PageShell } from "@/components/layout/PageShell";
import { Scale, FileText, AlertTriangle, Activity, Settings, UserCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getPublicSiteSettings } from "@/lib/api/public-settings";

export const metadata = {
    title: "Terms of Service",
    description: "The rules, guidelines, and agreements for using our platform.",
};

export default async function TermsOfServicePage() {
    const siteSettings = await getPublicSiteSettings();
    const siteName = siteSettings.identity.siteName || "Our Platform";

    return (
        <PageShell>
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-muted/30 border-b">
                <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[bottom_1px_center] dark:bg-grid-slate-400/[0.05] dark:bg-bottom" />
                <div className="container relative mx-auto px-4 py-20 md:py-32 max-w-5xl">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary mb-6 text-sm font-medium">
                            <Scale className="h-4 w-4" />
                            <span>Legal Agreement</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
                            Terms of Service
                        </h1>
                        <p className="text-xl text-muted-foreground leading-relaxed">
                            These terms govern your access to and use of {siteName}.
                            By using our services, you agree to these transparent, fair-use guidelines designed
                            to keep our community safe and our platform reliable.
                        </p>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="container mx-auto px-4 py-16 max-w-5xl">
                <div className="grid md:grid-cols-12 gap-12">
                    {/* Table of Contents - Desktop */}
                    <div className="hidden md:block md:col-span-4">
                        <div className="sticky top-24">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                                Contents
                            </h3>
                            <nav className="flex flex-col gap-3">
                                <a href="#acceptance" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2">
                                    <UserCheck className="h-4 w-4 text-muted-foreground" /> Acceptance of Terms
                                </a>
                                <a href="#license" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" /> Use License
                                </a>
                                <a href="#conduct" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-muted-foreground" /> User Conduct
                                </a>
                                <a href="#availability" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-muted-foreground" /> Service Availability
                                </a>
                                <a href="#modifications" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2">
                                    <Settings className="h-4 w-4 text-muted-foreground" /> Modifications
                                </a>
                            </nav>

                            <Card className="mt-8 bg-primary/5 border-primary/10">
                                <CardContent className="p-4">
                                    <p className="text-sm font-medium text-primary">
                                        Please read these terms carefully. They establish a legal agreement establishing both your rights and obligations while using the platform.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Main Body */}
                    <div className="md:col-span-8 space-y-12">
                        <section id="acceptance" className="scroll-mt-24">
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    1
                                </div>
                                Acceptance of Terms
                            </h2>
                            <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground">
                                <p>
                                    By accessing, browsing, or utilizing the {siteName} platform in any capacity, you acknowledge that you have read, understood, and proactively agree to be bound by these Terms of Service.
                                </p>
                                <p>
                                    If you are entering into these Terms on behalf of a company, organization, or another legal entity, you represent that you have the requisite authority to bind such entity to these agreements. If you do not agree with any provision stated herein, you are expressly prohibited from using our services.
                                </p>
                            </div>
                        </section>

                        <section id="license" className="scroll-mt-24">
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    2
                                </div>
                                Use License
                            </h2>
                            <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground">
                                <p>
                                    We grant you a personal, worldwide, royalty-free, non-assignable, and non-exclusive license to use the software provided to you as part of the services.
                                </p>
                                <ul className="mt-4">
                                    <li>You may not copy, modify, distribute, sell, or lease any part of our services or included software unless explicitly permitted.</li>
                                    <li>You may not reverse engineer or attempt to extract the source code of our software architecture unless laws prohibit those restrictions or you have our written permission.</li>
                                </ul>
                            </div>
                        </section>

                        <section id="conduct" className="scroll-mt-24">
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    3
                                </div>
                                User Conduct & Content
                            </h2>
                            <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground">
                                <p>
                                    We strive to maintain a safe, respectful, and legally compliant environment for all users reading and interacting with content on {siteName}.
                                </p>
                                <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 mt-6 mb-4">
                                    <h4 className="font-semibold text-destructive mb-2 flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4" /> Prohibited Activities
                                    </h4>
                                    <ul className="text-sm text-muted-foreground m-0 space-y-1">
                                        <li>Engaging in illegal activities or promoting dangerous acts.</li>
                                        <li>Utilizing automated scripts or bots to extract data (scraping) without explicit API access.</li>
                                        <li>Attempting to probe, scan, or test the vulnerability of any system or network.</li>
                                        <li>Interfering with, or disrupting, the access of any user, host, or network.</li>
                                    </ul>
                                </div>
                                <p>
                                    You retain all ownership rights to the content you publish. However, by posting content, you grant us a worldwide license to use, host, store, and display that content on our platform solely to provide our service to users.
                                </p>
                            </div>
                        </section>

                        <section id="availability" className="scroll-mt-24">
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    4
                                </div>
                                Service Availability & Liability
                            </h2>
                            <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground">
                                <p>
                                    While our engineering team works diligently to ensure 99.9% uptime, the {siteName} platform and its associated services are securely provided on an "as is" and "as available" basis.
                                </p>
                                <p>
                                    In no event shall {siteName}, its developers, or its suppliers be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or inability to access or use the services.
                                </p>
                            </div>
                        </section>

                        <section id="modifications" className="scroll-mt-24">
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    5
                                </div>
                                Modifications to Terms
                            </h2>
                            <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground">
                                <p>
                                    We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect.
                                </p>
                                <p>
                                    What constitutes a material change will be determined at our sole discretion. By continuing to access or use our services after those revisions become effective, you agree to be bound by the revised terms.
                                </p>
                                <div className="mt-8 pt-6 border-t font-medium text-sm">
                                    Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </PageShell>
    );
}
