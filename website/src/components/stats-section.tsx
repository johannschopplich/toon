import { useEffect, useRef, useState } from "react";

import type { FunctionComponent } from "react";

const StatsSection: FunctionComponent = () => {
    const [isVisible, setIsVisible] = useState(false)
    const [animateNumbers, setAnimateNumbers] = useState(false)
    const sectionRef = useRef<HTMLElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true)
                    setTimeout(() => setAnimateNumbers(true), 200)
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
        <section ref={sectionRef} className="bg-primary py-12 md:py-20">
            <div className="container max-w-7xl px-4">
                <div
                    className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                >
                    <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_1fr_1fr] gap-8 md:gap-6 items-center">
                        {/* Labels */}
                        <div className="flex md:flex-col gap-4 md:gap-6 justify-center md:justify-start">
                            <div className="flex items-center gap-2 md:gap-3">
                                <span className="font-mono text-sm md:text-base text-primary-foreground whitespace-nowrap">TOON</span>
                                <span className="text-primary-foreground">→</span>
                            </div>
                            <div className="flex items-center gap-2 md:gap-3">
                                <span className="font-mono text-sm md:text-base text-primary-foreground whitespace-nowrap">JSON</span>
                                <span className="text-primary-foreground">→</span>
                            </div>
                        </div>

                        {/* Average tokens chart */}
                        <div className="space-y-3 md:space-y-4">
                            <div className="flex items-center gap-2 md:gap-4 border-l-2 border-primary-foreground/30 pl-4 md:pl-6">
                                <h3 className="font-mono text-sm md:text-base font-semibold text-primary-foreground whitespace-nowrap">
                                    avg tokens
                                </h3>
                            </div>
                            <div className="space-y-3 md:space-y-4 pl-4 md:pl-6">
                                <div
                                    className={`h-8 md:h-12 relative overflow-hidden transition-all duration-1000 ${animateNumbers ? "w-full" : "w-0"}`}
                                >
                                    <div className="absolute inset-0 bg-[#F6F1E8] border border-primary-foreground rounded">
                                        <div className="absolute inset-y-0 left-0 w-[55%] bg-[#F6F1E8]"></div>
                                        <div
                                            className="absolute inset-y-0 left-[55%] right-0"
                                            style={{
                                                background:
                                                    "repeating-linear-gradient(45deg, #143464, #143464 3px, transparent 3px, transparent 7px)",
                                                opacity: 0.3,
                                            }}
                                        ></div>
                                    </div>
                                </div>
                                <div
                                    className={`h-8 md:h-12 bg-[#F6F1E8] border border-primary-foreground rounded transition-all duration-1000 delay-150 ${animateNumbers ? "w-full" : "w-0"}`}
                                ></div>
                            </div>
                        </div>

                        {/* Retrieval accuracy */}
                        <div className="space-y-3 md:space-y-4">
                            <div className="flex items-center gap-2 md:gap-4 border-l-2 border-primary-foreground/30 pl-4 md:pl-6">
                                <h3 className="font-mono text-sm md:text-base font-semibold text-primary-foreground whitespace-nowrap">
                                    retrieval accuracy
                                </h3>
                            </div>
                            <div className="space-y-2 md:space-y-3 pl-4 md:pl-6">
                                <div
                                    className={`flex items-center gap-2 md:gap-3 transition-all duration-700 delay-300 ${animateNumbers ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
                                >
                                    <span className="text-primary-foreground text-lg md:text-xl">◆</span>
                                    <span className="text-primary-foreground text-lg md:text-xl">→</span>
                                    <span className="text-2xl md:text-4xl font-bold font-mono text-primary-foreground">73.9%</span>
                                </div>
                                <div
                                    className={`flex items-center gap-2 md:gap-3 transition-all duration-700 delay-500 ${animateNumbers ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
                                >
                                    <span className="text-primary-foreground text-lg md:text-xl">◆</span>
                                    <span className="text-primary-foreground text-lg md:text-xl">→</span>
                                    <span className="text-2xl md:text-4xl font-bold font-mono text-primary-foreground">69.7%</span>
                                </div>
                            </div>
                        </div>

                        {/* Best for */}
                         <div className="space-y-3 md:space-y-4">
                            <div className="flex items-center gap-2 md:gap-4 border-l-2 border-primary-foreground/30 pl-4 md:pl-6">
                                <h3 className="font-mono text-sm md:text-base font-semibold text-primary-foreground whitespace-nowrap">
                                    best for
                                </h3>
                            </div>
                            <div className="space-y-2 md:space-y-3 pl-4 md:pl-6">
                                <div
                                    className={`flex items-center gap-2 md:gap-3 transition-all duration-700 delay-300  text-sm md:text-base text-primary-foreground ${animateNumbers ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
                                >
                                   <ul className="list items-center gap-2 list-item">
                                        <li> <span>•</span> repeated structure</li>
                                        <li> <span>•</span> tables</li>
                                        <li> <span>•</span> varying fields</li>
                                        <li> <span>•</span> deep trees</li>
                                    </ul>
                                </div>
                               
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default StatsSection;