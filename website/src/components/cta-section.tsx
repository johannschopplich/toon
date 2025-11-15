import type { FunctionComponent } from "react";

import { BookOpen, Code } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

const CTASection: FunctionComponent = () => {
    const [isVisible, setIsVisible] = useState(false)
    const sectionRef = useRef<HTMLElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true)
                }
            },
            { threshold: 0.1 },
        )

        if (sectionRef.current) {
            observer.observe(sectionRef.current)
        }

        return () => observer.disconnect()
    }, [])

    return (
        <section ref={sectionRef} className="bg-primary py-24">
            <div className="container max-w-screen-2xl px-4">
                <div className="rounded-xl border border-primary-foreground/20 bg-primary p-12 text-center">
                    <div className={`space-y-8 ${isVisible ? "animate-fade-up" : "opacity-0"}`}>
                        <div className="space-y-4">
                            <h2 className="text-3xl font-bold tracking-tight text-balance text-primary-foreground sm:text-4xl md:text-5xl">
                                Ready to optimize your LLM prompts?
                            </h2>
                            <p className="text-lg max-w-2xl mx-auto text-primary-foreground/90">
                                Start using TOON today and reduce your token usage by up to 60%
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row justify-center">
                            <Button
                                size="lg"
                                className="gap-2 rounded-lg bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                             onClick={() => {
                                window.location.href = "https://github.com/toon-format/toon?tab=readme-ov-file#installation--quick-start"
                            }}>
                                <BookOpen className="h-4 w-4" />
                                Get started
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="gap-2 border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary rounded-lg bg-transparent"
                            onClick={() => {
                                window.location.href = "https://github.com/toon-format/toon#readme"
                            }}>
                                <Code className="h-4 w-4" />
                                Read the docs
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default CTASection;