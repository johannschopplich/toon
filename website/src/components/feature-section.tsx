import type { FunctionComponent } from "react";
import { Brain, Eye, Shield, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Card } from "./card";

const features = [
    {
        icon: Zap,
        title: "30-60% Token Reduction",
        description: "Significantly reduce token usage compared to JSON, saving costs and improving performance.",
    },
    {
        icon: Shield,
        title: "Schema-aware",
        description: "Predictable retrieval with structured data that LLMs can parse reliably.",
    },
    {
        icon: Brain,
        title: "LLM-friendly",
        description: "Optimized for repeated structures, tables, deep trees, and varying fields.",
    },
    {
        icon: Eye,
        title: "Human-readable",
        description: "Easy to debug and understand, maintaining readability while being compact.",
    },
]
const FeatureSection: FunctionComponent = () => {
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
        <section ref={sectionRef} className="bg-muted py-24">
            <div className="container max-w-screen-2xl px-4">
                <div className="space-y-12">
                    <div className={`text-center space-y-4 ${isVisible ? "animate-fade-up" : "opacity-0"}`}>
                        <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl md:text-5xl">Why TOON?</h2>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {features.map((feature, index) => (
                            // Adding staggered animation and hover scale effect
                            <Card
                                key={index}
                                className={`p-6 bg-card border-border rounded-xl transition-all duration-300 hover:shadow-xl hover:scale-105 ${isVisible ? `animate-fade-up animate-delay-${(index + 1) * 100}` : "opacity-0"
                                    }`}
                            >
                                <div className="space-y-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                                        <feature.icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-semibold">{feature.title}</h3>
                                        <p className="text-sm leading-relaxed opacity-90">{feature.description}</p>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default FeatureSection;