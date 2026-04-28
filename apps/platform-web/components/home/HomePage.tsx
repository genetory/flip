import { Header } from "../site/Header";
import { CoverSection } from "../site/CoverSection";
import { Hero } from "../site/Hero";
import { Sponsors } from "../site/Sponsors";
import { Positions } from "../site/Positions";
import { StudentProfile } from "../site/StudentProfile";
import { BusinessValue } from "../site/BusinessValue";
import { Scenario } from "../site/Scenario";
import { TestimonialsSection } from "../site/TestimonialsSection";
import { FAQ } from "../site/FAQ";
import { FinalCTA } from "../site/FinalCTA";
import { Footer } from "../site/Footer";
import { ProvenResults } from "../site/ProvenResults";

export function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased">
      <Header />
      <main>
        <CoverSection />
        <Hero />
        <Positions />
        <StudentProfile />
        <Scenario />
        <TestimonialsSection />
        <FAQ />
        <FinalCTA />
        <BusinessValue />
        <ProvenResults />
        <Sponsors />
      </main>
      <Footer />
    </div>
  );
}
