"use client"

import { Navigation } from "@/components/landing/navigation"
import { HeroSection } from "@/components/landing/hero-section"
import { PartnersSection } from "@/components/landing/partners-section"
import { AboutSection } from "@/components/landing/about-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { ProcessSection } from "@/components/landing/process-section"
import { TestimonialsSection } from "@/components/landing/testimonials-section"
import { TutorialsSection } from "@/components/landing/tutorials-section"
import { FAQSection } from "@/components/landing/faq-section"
import { SupportSection } from "@/components/landing/support-section"
import { FooterSection } from "@/components/landing/footer-section"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F0FDF4] text-emerald-950 antialiased selection:bg-emerald-200 selection:text-emerald-900">
      <Navigation />
      <main>
        <HeroSection />
        <PartnersSection />
        <AboutSection />
        <FeaturesSection />
        <ProcessSection />
        <TestimonialsSection />
        <TutorialsSection />
        <FAQSection />
        <SupportSection />
      </main>
      <FooterSection />
    </div>
  )
}
