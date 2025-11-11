import type { FunctionComponent } from "react";
import SEO from "../../helmet/seo";

interface DocsProps {
}

const Docs: FunctionComponent<DocsProps> = () => {
    return (<>
        <SEO
            title="Docs Page Title"
            description="A detailed description of the Home page."
            canonical="https://yourdomain.com/"
            schemaMarkup={{
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                name: 'Your Site',
                url: 'https://yourdomain.com/',
            }}
        />

        <h1>Docs Token-Oriented Object Notation (TOON)</h1>
        <p>Token-Oriented Object Notation is a compact, human-readable serialization format designed for passing structured data to Large Language Models with significantly reduced token usage. It's intended for LLM input as a lossless, drop-in representation of JSON data.</p>
    </>);
}

export default Docs;