
import type { FunctionComponent } from "react"
import { Link } from "react-router-dom";

import logo from "@/assets/images/logo.svg";

const footerLinks = {
    quickLinks: [
        { label: "Home", href: "/" },
        { label: "Documentation", href: "#docs" },
        { label: "GitHub", href: "#github" },
        { label: "Examples", href: "#examples" },
    ],
    resources: [
        { label: "Getting Started", href: "#getting-started" },
        { label: "API Reference", href: "#api" },
        { label: "Contributing", href: "#contributing" },
        { label: "Community", href: "#community" },
    ],
    sitemap: [
        { label: "Features", href: "#features" },
        { label: "Use Cases", href: "#use-cases" },
        { label: "Metrics", href: "#metrics" },
        { label: "Support", href: "#support" },
    ],
}

const Footer: FunctionComponent = () => {
    return (
        <footer className="border-t border-border bg-background">
            <div className="container max-w-screen-2xl px-4 py-12">
                <div className="grid gap-8 lg:grid-cols-2 md:grid-cols-4 sm:grid-cols-2 lg:gap-12">
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
