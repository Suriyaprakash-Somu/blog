import { PageShell } from "@/components/layout/PageShell";
import { Shield, Lock, EyeOff, Database, Server, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getPublicSiteSettings } from "@/lib/api/public-settings";

export const metadata = {
    title: "Privacy Policy",
    description: "Our steadfast commitment to protecting your privacy and personal data.",
};

export default async function PrivacyPolicyPage() {
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
                            <Shield className="h-4 w-4" />
                            <span>Trust & Security</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
                            Privacy Policy
                        </h1>
                        <p className="text-xl text-muted-foreground leading-relaxed">
                            At {siteName}, your privacy is not an afterthought—it's a foundational principle.
                            We believe your data belongs to you. We do not sell it, rent it, or trade it.
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
                                <a href="#collection" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2">
                                    <Database className="h-4 w-4 text-muted-foreground" /> Data Collection
                                </a>
                                <a href="#usage" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2">
                                    <EyeOff className="h-4 w-4 text-muted-foreground" /> How We Use Data
                                </a>
                                <a href="#security" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2">
                                    <Lock className="h-4 w-4 text-muted-foreground" /> Security Practices
                                </a>
                                <a href="#infrastructure" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2">
                                    <Server className="h-4 w-4 text-muted-foreground" /> Infrastructure
                                </a>
                                <a href="#updates" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2">
                                    <RefreshCw className="h-4 w-4 text-muted-foreground" /> Policy Updates
                                </a>
                            </nav>

                            <Card className="mt-8 bg-primary/5 border-primary/10">
                                <CardContent className="p-4">
                                    <p className="text-sm font-medium text-primary">
                                        Our core promise is simple: We will never monetize your personal reading habits, interactions, or profile data.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Main Body */}
                    <div className="md:col-span-8 space-y-12">
                        <section id="collection" className="scroll-mt-24">
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    1
                                </div>
                                Data Collection
                            </h2>
                            <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground">
                                <p>
                                    We only collect the absolute minimum amount of information necessary to provide you with an exceptional reading and interaction experience on our platform.
                                </p>
                                <ul>
                                    <li><strong>Account Information:</strong> If you choose to create an account, we collect your name, email address, and authentication credentials.</li>
                                    <li><strong>Usage Data:</strong> We monitor aggregated performance metrics and platform stability to ensure fast loading times and discover technical issues.</li>
                                    <li><strong>Cookies:</strong> We use essential cookies to maintain your login session and remember your core preferences (like Light or Dark mode).</li>
                                </ul>
                            </div>
                        </section>

                        <section id="usage" className="scroll-mt-24">
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    2
                                </div>
                                How We Use Data
                            </h2>
                            <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground">
                                <p>
                                    <strong>We do not sell user data under any circumstances.</strong> Every piece of data we collect is utilized strictly for service delivery and optimization.
                                </p>
                                <div className="grid sm:grid-cols-2 gap-4 mt-6">
                                    <div className="p-4 rounded-xl border bg-card">
                                        <h4 className="font-semibold text-foreground mb-2">Service Delivery</h4>
                                        <p className="text-sm m-0 leading-relaxed text-muted-foreground">Authorizing your access, delivering content, and saving your preferences across sessions.</p>
                                    </div>
                                    <div className="p-4 rounded-xl border bg-card">
                                        <h4 className="font-semibold text-foreground mb-2">Platform Improvement</h4>
                                        <p className="text-sm m-0 leading-relaxed text-muted-foreground">Identifying bugs, optimizing databases, and ensuring the platform remains fast and reliable.</p>
                                    </div>
                                    <div className="p-4 rounded-xl border bg-card">
                                        <h4 className="font-semibold text-foreground mb-2">Communication</h4>
                                        <p className="text-sm m-0 leading-relaxed text-muted-foreground">Sending you important security alerts, platform updates, and password reset instructions.</p>
                                    </div>
                                    <div className="p-4 rounded-xl border bg-card">
                                        <h4 className="font-semibold text-foreground mb-2">Compliance</h4>
                                        <p className="text-sm m-0 leading-relaxed text-muted-foreground">Protecting against malicious activity, unauthorized access, and automated abuse.</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section id="security" className="scroll-mt-24">
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    3
                                </div>
                                Security Practices
                            </h2>
                            <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground">
                                <p>
                                    We implement robust, industry-standard security protocols to safeguard your information from unauthorized access, alteration, disclosure, or destruction.
                                </p>
                                <p>
                                    All data transmitted between your browser and our servers is secured using modern TLS encryption. Sensitive credentials, such as passwords, are heavily hashed and salted using industry-best algorithms before they ever touch our database.
                                </p>
                            </div>
                        </section>

                        <section id="infrastructure" className="scroll-mt-24">
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    4
                                </div>
                                Infrastructure
                            </h2>
                            <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground">
                                <p>
                                    To provide our services reliably on a global scale, we may utilize trusted third-party cloud infrastructure providers for hosting, static asset delivery, and database operations.
                                </p>
                                <p>
                                    These infrastructure providers act solely as data processors on our behalf. They are strictly prohibited by contract from accessing, mining, or utilizing your data for any independent commercial purpose.
                                </p>
                            </div>
                        </section>

                        <section id="updates" className="scroll-mt-24">
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    5
                                </div>
                                Policy Updates
                            </h2>
                            <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground">
                                <p>
                                    As {siteName} evolves, we may periodically update this Privacy Policy to reflect changes in our practices or regulatory requirements. Rest assured, our core commitment to not selling your data will never change.
                                </p>
                                <p>
                                    If we make significant material changes, we will notify registered users via email and place a prominent notice on the platform prior to the changes taking effect.
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
