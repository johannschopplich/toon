import type { FunctionComponent } from "react";

import { FileJson, Network, Repeat, Table } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Card } from "./card";

const useCases = [
    {
        icon: Repeat,
        title: "Repeated structure",
        description: "Ideal for data with consistent patterns and recurring schemas.",
    },
    {
        icon: Table,
        title: "Tables",
        description: "Efficiently encode tabular data with less tokens.",
    },
    {
        icon: FileJson,
        title: "Varying fields",
        description: "Handle dynamic schemas and optional fields gracefully.",
    },
    {
        icon: Network,
        title: "Deep trees",
        description: "Compact nested hierarchies and complex object structures.",
    },
]


const UseCasesSection: FunctionComponent = () => {
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
                        <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl md:text-5xl">Use Cases</h2>
                        <p className="text-lg max-w-2xl mx-auto opacity-90">
                            TOON excels in scenarios where token efficiency and reliable retrieval are critical
                        </p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {useCases.map((useCase, index) => (
                            // Adding staggered animation and hover scale effect
                            <Card
                                key={index}
                                className={`p-6 bg-card border-border rounded-xl transition-all duration-300 hover:shadow-xl hover:scale-105 ${isVisible ? `animate-fade-up animate-delay-${(index + 1) * 100}` : "opacity-0"
                                    }`}
                            >
                                <div className="space-y-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                                        <useCase.icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="font-semibold font-mono">{useCase.title}</h3>
                                        <p className="text-sm leading-relaxed opacity-90">{useCase.description}</p>
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

export default UseCasesSection;