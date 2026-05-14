import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ProblemSection } from './components/ProblemSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { DashboardSection } from './components/DashboardSection';
import { FeaturesSection } from './components/FeaturesSection';
import { ArchitectureSection } from './components/ArchitectureSection';
import { CTASection } from './components/CTASection';
import { Footer } from './components/Footer';
import { DemoShowcasePage } from './pages/DemoShowcasePage';
import '../styles/fonts.css';

export default function App() {
  if (window.location.pathname === '/demos') {
    return <DemoShowcasePage />;
  }

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", backgroundColor: '#ffffff' }}>
      <Navbar />
      <div id="product">
        <HeroSection />
      </div>
      <ProblemSection />
      <div id="how-it-works">
        <HowItWorksSection />
      </div>
      <DashboardSection />
      <div id="features">
        <FeaturesSection />
      </div>
      <div id="architecture">
        <ArchitectureSection />
      </div>
      <div id="request-access">
        <CTASection />
      </div>
      <Footer />
    </div>
  );
}
