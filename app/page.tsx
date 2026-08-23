import HeroSection from "@/components/HeroSection";
import PunchCardBooking from "@/components/PunchCardBooking";
import StoryTerminal from "@/components/StoryTerminal";
import TestimonialList from "@/components/TestimonialList";
import SiteFooter from "@/components/SiteFooter";

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <StoryTerminal />
      <TestimonialList />
      <PunchCardBooking />
      <SiteFooter />
    </main>
  );
}
