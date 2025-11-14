import type { FunctionComponent } from "react";
import FeatureSection from "@/components/feature-section";
import Footer from "@/components/footer";
import HeroSection from "@/components/hero-section";
import NavBar from "@/components/navbar";
import StatsSection from "@/components/stats-section";

import SEO from "../../helmet/seo";

const Home: FunctionComponent = () => {
    return (<>
        <SEO
            title="TOON"
            description="Token-Oriented Object Notation is a compact, human-readable serialization format designed for passing structured data to Large Language Models with significantly reduced token usage. It's intended for LLM input as a lossless, drop-in representation of JSON data." 
            canonical="https://toonformat.dev/"
            schemaMarkup={{
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                name: 'Toon',
                url: 'https://toonformat.dev//',

            }}
        />
        <NavBar />
        <HeroSection/>
        <FeatureSection/>
        <StatsSection/>
        <Footer />
    </>);
}

export default Home;