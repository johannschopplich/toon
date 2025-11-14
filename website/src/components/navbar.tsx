import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import logo from "@/assets/images/logo.svg";

import { Button } from "./ui/button";

import type { FunctionComponent } from "react";

const NavBar: FunctionComponent = () => {
    const [theme, setTheme] = useState<"light" | "dark">("dark")

    useEffect(() => {
        const root = document.documentElement
        const initialTheme = root.classList.contains("dark") ? "dark" : "light"
        setTheme(initialTheme)
    }, [])

    const toggleTheme = () => {
        const root = document.documentElement
        const newTheme = theme === "light" ? "dark" : "light"

        if (newTheme === "dark") {
            root.classList.add("dark")
        } else {
            root.classList.remove("dark")
        }

        setTheme(newTheme)
    }

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 max-w-screen-2xl items-center">
                <div className="mr-4 flex">
                    <Link to="/" className="mr-6 flex items-center space-x-2">
                        <div className="transition-transform hover:scale-110">
                            <img src={logo} alt="TOON" width={24} height={24} className="w-8 h-8" />
                        </div>
                    </Link>
                </div>

                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                    <nav className="flex items-center space-x-6">
                        <Link to="#docs" className="text-sm font-medium transition-colors hover:opacity-70">
                            Docs
                        </Link>
                        <Link to="https://github.com/toon-format/toon#readme" className="text-sm font-medium transition-colors hover:opacity-70">
                            GitHub
                        </Link>
                    </nav>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleTheme}
                        className="ml-2 transition-transform hover:scale-110"
                    >
                        {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                        <span className="sr-only">Toggle theme</span>
                    </Button>
                </div>
            </div>
        </nav>
    );
}

export default NavBar;