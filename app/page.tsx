import { LandingBackground } from "@/components/landing/landing-background";
import { LandingNavbar } from "@/components/landing/navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { FeatureCards } from "@/components/landing/feature-cards";
import { ModulesSection } from "@/components/landing/modules-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { ContactSection } from "@/components/landing/contact-section";
import { LandingFooter } from "@/components/landing/landing-footer";

export default function LandingPage() {
  return (
    <LandingBackground>
      <LandingNavbar />
      <main>
        <HeroSection />
        <FeatureCards />
        <ModulesSection />
        <PricingSection />
        <ContactSection />
      </main>
      <LandingFooter />
    </LandingBackground>
  );
}
