import { Header } from "../site/Header";
import { Hero } from "../site/Hero";
import { Positions } from "../site/Positions";
import { StudentProfile } from "../site/StudentProfile";
import { BusinessValue } from "../site/BusinessValue";
import { HowItWorks } from "../site/HowItWorks";
import { Scenario } from "../site/Scenario";
import { FAQ } from "../site/FAQ";
import { FinalCTA } from "../site/FinalCTA";
import { Footer } from "../site/Footer";

export function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased">
      <Header />
      <main>
        <Hero />
        <Positions />
        <StudentProfile />
        <BusinessValue />
        <HowItWorks />
        <Scenario />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
