import type { FunctionComponent } from "react";
import { Helmet } from "react-helmet-async";

interface SEOProps {
    title: string;
    description: string;
    canonical: string;
    image?: string;
    schemaMarkup: {
        '@context': string; '@type': string; name: string; url: string
    }
}

const SEO: FunctionComponent<SEOProps> = ({ title, description, canonical, image, schemaMarkup }) => {
    return (<Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />

        {/* Open Graph for Facebook, LinkedIn */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={image} />

        {/* Twitter Card */}
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={image} />

        {/* Structured Data (Schema Markup) */}
        {schemaMarkup && (
            <script type="application/ld+json">
                {JSON.stringify(schemaMarkup)}
            </script>
        )}
    </Helmet>);
}

export default SEO;