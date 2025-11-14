import { useEffect, useRef, useState } from "react";

import { Card } from "./card";
import { Button } from "./ui/button";

import type { FunctionComponent } from "react";

const HeroSection: FunctionComponent = () => {
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef<HTMLElement>(null);

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
        <section
            ref={sectionRef}
            className="relative bg-background container max-w-screen-2xl px-4 py-24 md:py-32 lg:py-40"
        >
            <div className="flex flex-col items-center text-center space-y-12">
                {/* Text content */}
                <div className={`flex flex-col space-y-8 max-w-4xl ${isVisible ? "animate-fade-up" : "opacity-0"}`}>
                    <div className="space-y-4">
                        <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl md:text-6xl lg:text-7xl">
                            Token-Oriented Object Notation
                        </h1>
                        <p className="text-lg leading-relaxed text-balance md:text-xl">
                            Compact serialization for LLM input • Schema-aware, predictable retrieval
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row justify-center">
                        <Button size="lg" className="gap-2 rounded-lg"
                            onClick={() => {
                                window.location.href = "https://github.com/toon-format/toon/blob/main/README.md"
                            }}>
                            Get started
                        </Button>
                        <Button size="lg" variant="outline" className="gap-2 bg-transparent border-2 rounded-lg"
                            onClick={() => {
                                window.location.href = "https://github.com/toon-format/toon#readme"
                            }}>
                            View on GitHub
                        </Button>
                    </div>
                </div>

                <Card
                    className={`p-6 md:p-8 lg:p-12 bg-card border-border w-full max-w-5xl rounded-xl transition-all hover:shadow-xl ${isVisible ? "animate-fade-up animate-delay-200" : "opacity-0"}`}
                >
                    <div className="space-y-8 md:space-y-10">
                        {/* Workflow diagram */}
                        <div className="flex flex-col gap-4 md:gap-6">
                            <div className="text-base font-mono font-semibold">Workflow:</div>
                            <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6">
                                <div className="border-2 border-foreground px-8 py-3 md:px-10 md:py-4 rounded text-center font-mono text-base md:text-lg font-semibold w-full max-w-[200px] md:w-auto md:min-w-[120px]">
                                    JSON
                                </div>
                                <div className="text-2xl rotate-90 md:rotate-0">→</div>
                                <div className="relative px-6 py-3 md:px-8 md:py-4">
                                    <div
                                        className="absolute inset-0 rounded"
                                        style={{
                                            backgroundImage:
                                                "repeating-linear-gradient(45deg, transparent, transparent 3px, currentColor 3px, currentColor 4px)",
                                            opacity: 0.3,
                                        }}
                                    ></div>
                                    <span className="relative font-mono italic text-base md:text-lg">encode()</span>
                                </div>
                                <div className="text-2xl rotate-90 md:rotate-0">→</div>
                                <div className="relative px-8 py-3 md:px-10 md:py-4 rounded text-center font-mono text-base md:text-lg font-semibold w-full max-w-[200px] md:w-auto md:min-w-[140px] border-l-2 border-t-2 border-b-2 border-foreground">
                                    <div className="absolute top-0 bottom-0 right-10 md:right-16 w-[2px] border-r-2 border-dashed border-foreground"></div>
                                    <div className="absolute top-0 bottom-0 right-0 w-10 md:w-16 border-r-2 border-dotted border-foreground rounded-r"></div>
                                    TOON
                                </div>
                                <div className="text-2xl rotate-90 md:rotate-0">→</div>
                                <div className="px-6 py-3 md:px-8 md:py-4 rounded text-center font-mono text-base md:text-lg font-semibold bg-foreground text-background w-full max-w-[200px] md:w-auto md:min-w-[100px]">
                                    LLM
                                </div>
                            </div>
                        </div>

                        {/* Tokens comparison */}
                        <div className="flex flex-col gap-4 md:gap-6">
                            <div className="text-base font-mono font-semibold">Tokens:</div>
                            <div className="flex flex-col md:flex-row items-center md:justify-center gap-4 md:gap-6 w-full">
                                {/* Full bar on left */}
                                <div className="h-10 md:h-12 bg-foreground rounded w-full max-w-[280px] md:w-48"></div>
                                <div className="text-2xl rotate-90 md:rotate-0">→</div>
                                {/* Reduced bar + striped section on right */}
                                <div className="flex items-center gap-0 w-full max-w-[280px] md:w-auto">
                                    <div className="h-10 md:h-12 bg-foreground rounded-l flex-1 md:w-32"></div>
                                    <div className="relative w-20 md:w-16 h-10 md:h-12 rounded-r overflow-hidden">
                                        <div
                                            className="absolute inset-0"
                                            style={{
                                                backgroundImage:
                                                    "repeating-linear-gradient(45deg, transparent, transparent 3px, currentColor 3px, currentColor 4px)",
                                                opacity: 0.3,
                                            }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="text-base md:text-lg font-mono whitespace-nowrap">≈30-60% less</div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </section>
    )
}

export default HeroSection;