import HeroSection from "../sections/hero-section";
import OurLatestCreation from "../sections/our-latest-creation";
import AboutOurApps from "../sections/about-our-apps";
import SubscribeNewsletter from "../sections/subscribe-newsletter";

export default function Home() {
    return (
        <main className="px-6 md:px-16 lg:px-24 xl:px-32">
            <HeroSection />
            <OurLatestCreation />
            <AboutOurApps />
            <SubscribeNewsletter />
        </main>
    );
}
