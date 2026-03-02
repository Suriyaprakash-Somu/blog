import { PageShell } from "@/components/layout/PageShell";
import { Cookie, Shield, BarChart, Settings, Smartphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getPublicSiteSettings } from "@/lib/api/public-settings";

export const metadata = {
    title: "Cookie Policy",
    description: "Insight into how we use cookies for a seamless experience.",
};

export default async function CookiePolicyPage() {
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
                            <Cookie className="h-4 w-4" />
                            <span>Transparency & Control</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
                            Cookie Policy
                        </h1>
                        <p className="text-xl text-muted-foreground leading-relaxed">
                            We use cookies transparently—not to track you across the internet, but simply to keep you logged in, remember your theme preferences, and ensure {siteName} runs smoothly.
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
                                <a href="#what-are-cookies" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2">
                                    <Cookie className="h-4 w-4 text-muted-foreground" /> What Are Cookies?
                                </a>
                                <a href="#how-we-use" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2">
                                    <BarChart className="h-4 w-4 text-muted-foreground" /> How We Use Them
                                </a>
                                <a href="#managing" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2">
                                    <Settings className="h-4 w-4 text-muted-foreground" /> Managing Cookies
                                </a>
                                <a href="#third-party" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-muted-foreground" /> Third-Party Providers
                                </a>
                            </nav>

                            <Card className="mt-8 bg-primary/5 border-primary/10">
                                <CardContent className="p-4">
                                    <p className="text-sm font-medium text-primary flex items-center gap-2">
                                        <Smartphone className="h-4 w-4 shrink-0" />
                                        Essential cookies are required to authenticate your session and access protected features on {siteName}.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Main Body */}
                    <div className="md:col-span-8 space-y-12">
                        <section id="what-are-cookies" className="scroll-mt-24">
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    1
                                </div>
                                What Are Cookies?
                            </h2>
                            <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground">
                                <p>
                                    Cookies are small text files automatically stored on your browser or device by websites you visit. They serve crucial functions, primarily helping the website remember your device over time, saving you the hassle of logging in repeatedly or resetting your preferences upon every visit.
                                </p>
                            </div>
                        </section>

                        <section id="how-we-use" className="scroll-mt-24">
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    2
                                </div>
                                How We Use Cookies
                            </h2>
                            <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground">
                                <p>
                                    Unlike platforms that rely on targeted advertising, our use of cookies is fundamentally aligned with providing you a better, faster, and more secure reading experience.
                                </p>
                                <div className="grid sm:grid-cols-2 gap-4 mt-6">
                                    <div className="p-4 rounded-xl border bg-card">
                                        <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-primary" /> Essential Security
                                        </h4>
                                        <p className="text-sm m-0 leading-relaxed text-muted-foreground">We issue secure session tokens stored locally to keep you authenticated and protect against Cross-Site Request Forgery (CSRF) attacks.</p>
                                    </div>
                                    <div className="p-4 rounded-xl border bg-card">
                                        <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                                            <Settings className="h-4 w-4 text-primary" /> Preferences
                                        </h4>
                                        <p className="text-sm m-0 leading-relaxed text-muted-foreground">We remember UI choices—like whether you prefer Light or Dark mode—so your eyes aren't blinded by sudden flashes of white screen.</p>
                                    </div>
                                    <div className="p-4 rounded-xl border bg-card sm:col-span-2">
                                        <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                                            <BarChart className="h-4 w-4 text-primary" /> Aggregated Analytics
                                        </h4>
                                        <p className="text-sm m-0 leading-relaxed text-muted-foreground">We may utilize minimal, privacy-respecting analytics cookies to understand generalized traffic patterns. This data is strictly aggregated to measure what content is most engaging. <strong>We do not build individual marketing profiles.</strong></p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section id="managing" className="scroll-mt-24">
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    3
                                </div>
                                Managing Your Cookies
                            </h2>
                            <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground">
                                <p>
                                    You retain ultimate control over your browser. You can configure your browser settings to refuse some or all cookies.
                                </p>
                                <p>
                                    Please be aware that if you disable essential cookies, the core functionality of {siteName}—such as logging in, accessing the tenant dashboard, or participating in discussions—will be fundamentally broken, as the server will have no way of securely verifying your identity across pages.
                                </p>
                            </div>
                        </section>

                        <section id="third-party" className="scroll-mt-24">
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    4
                                </div>
                                Third-Party Providers
                            </h2>
                            <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground">
                                <p>
                                    To deliver {siteName} at scale, we occasionally integrate with infrastructure partners (e.g., content delivery networks or basic analytics).
                                </p>
                                <p>
                                    Any cookies placed by these required third parties are bound by strict processing agreements. We categorically do not permit our service providers to resell your analytical data, nor do we allow ad-networks to inject cross-site trackers on our platform.
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
