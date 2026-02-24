import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingCategories } from "@/components/landing/LandingCategories";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingStats } from "@/components/landing/LandingStats";
import { LandingNewsletter } from "@/components/landing/LandingNewsletter";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col overflow-hidden selection:bg-primary/30">
      <LandingHeader />
      <main className="flex-1 w-full">
        <LandingHero />
        <LandingCategories />
        <LandingFeatures />
        <LandingStats />
        <LandingNewsletter />
      </main>
      <LandingFooter />
    </div>
  );
}
