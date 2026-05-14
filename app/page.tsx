import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import HowItWorksSection from './components/HowItWorksSection';
import MaterialsSection from './components/MaterialsSection';
import StatisticsSection from './components/StatisticsSection';
import BenefitsSection from './components/BenefitsSection';
import TestimonialsSection from './components/TestimonialsSection';
import FAQSection from './components/FAQSection';
import Footer from './components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <MaterialsSection />
      <StatisticsSection />
      <BenefitsSection />
      <TestimonialsSection />
      <FAQSection />
      <Footer />
    </div>
  );
}
