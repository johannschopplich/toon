import type { FunctionComponent } from "react";
import NavBar from "@/components/navbar";

import SEO from "../../helmet/seo";

const Home: FunctionComponent = () => {
    return (<>
        <SEO
            title="Home Page Title"
            description="A detailed description of the Home page." canonical="https://yourdomain.com/"
            schemaMarkup={{
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                name: 'Your Site',
                url: 'https://yourdomain.com/',

            }}
        />
        <NavBar/>
        
    </>);
}

export default Home;