
import type { FunctionComponent } from "react"
import { Link } from "react-router-dom";

import logo from "@/assets/images/logo.svg";

const footerLinks = {
    quickLinks: [
        { label: "Home", href: "/" },
        { label: "Documentation", href: "https://github.com/toon-format/toon/blob/main/README.md" },
        { label: "GitHub", href: "https://github.com/toon-format/toon/tree/main" },
    ],
    resources: [
        { label: "Getting Started", href: "https://github.com/toon-format/toon/tree/main?tab=readme-ov-file#playgrounds" },

        { label: "Contributing", href: "https://github.com/toon-format/toon" },
        { label: "Community", href: "https://github.com/toon-format" },
    ],
    sitemap: [
        { label: "Features", href: "https://github.com/toon-format/toon?tab=readme-ov-file#key-features" },
        { label: "Playgrounds", href: "https://github.com/toon-format/toon/tree/main?tab=readme-ov-file#playgrounds" },
        { label: "Benchmarks", href: "https://github.com/toon-format/toon/tree/main/benchmarks" },
    ],
}

const Footer: FunctionComponent = () => {
    return (
        <footer className="border-t border-border bg-background">
            <div className="container max-w-screen-2xl px-4 py-12">
                <div className="grid gap-8 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 lg:gap-12">
                    <div className="space-y-4">
                        <div className="inline-block">
                            <img src={logo} alt="TOON" className="w-8 h-8" />
                        </div>
                        <p className="text-sm opacity-90 leading-relaxed max-w-xs">
                            Compact, human-readable, schema-aware serialization for LLM prompts
                        </p>
                    </div>

                    <div>
                        <h3 className="mb-4 text-sm font-semibold">Quick Links</h3>
                        <ul className="space-y-3">
                            {footerLinks.quickLinks.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        to={link.href}
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="mb-4 text-sm font-semibold">Resources</h3>
                        <ul className="space-y-3">
                            {footerLinks.resources.map((link) => (
                                <li key={link.label}>
                                    <Link to={link.href} className="text-sm opacity-80 hover:opacity-100 transition-opacity">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="mb-4 text-sm font-semibold">Community</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link to="#github" className="text-sm opacity-80 hover:opacity-100 transition-opacity">
                                    GitHub
                                </Link>
                            </li>
                            <li>
                                <Link to="#issues" className="text-sm opacity-80 hover:opacity-100 transition-opacity">
                                    Issues
                                </Link>
                            </li>
                            <li>
                                <Link to="#contributing" className="text-sm opacity-80 hover:opacity-100 transition-opacity">
                                    Contributing
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 border-t border-border pt-8">
                    <p className="text-center text-sm opacity-80 font-mono">© 2025 TOON – Token-Oriented Object Notation</p>
                </div>
            </div>
        </footer>
    )
}

export default Footer;
