"use client"

import { useState } from "react"
import Link from "next/link"
import { Building2, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Navigation() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
    const closeMenu = () => setIsMenuOpen(false)

    return (
        <nav className="fixed w-full z-50 top-0 start-0 border-b border-emerald-100 bg-[#F0FDF4]/90 backdrop-blur-md">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between px-6 py-4">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="h-9 w-9 bg-emerald-800 text-white flex items-center justify-center rounded-sm font-semibold text-lg tracking-tighter shadow-sm">
                        <Building2 className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold tracking-tight text-emerald-950 leading-none">
                            Kad Tax on Rent
                        </span>
                        <span className="text-[10px] text-emerald-600 font-medium tracking-wide uppercase mt-0.5">
                            Authorized Partner
                        </span>
                    </div>
                </Link>

                <div className="flex md:order-2 space-x-3 items-center">
                    <Link
                        href="/login"
                        className="hidden md:block text-emerald-800 hover:text-emerald-950 font-medium text-sm transition-colors"
                    >
                        Login
                    </Link>
                    <Button
                        asChild
                        className="bg-emerald-900 hover:bg-emerald-800 text-white rounded-md text-sm px-5 py-2 shadow-sm shadow-emerald-200/50 tracking-tight"
                    >
                        <Link href="/signup">Create Account</Link>
                    </Button>
                    <button
                        onClick={toggleMenu}
                        className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-emerald-800 rounded-lg md:hidden hover:bg-emerald-100 transition-colors"
                        aria-expanded={isMenuOpen}
                        aria-label="Toggle navigation menu"
                    >
                        {isMenuOpen ? (
                            <X className="w-5 h-5" strokeWidth={1.5} />
                        ) : (
                            <Menu className="w-5 h-5" strokeWidth={1.5} />
                        )}
                    </button>
                </div>

                {/* Mobile Menu */}
                <div
                    className={`${isMenuOpen ? 'block' : 'hidden'
                        } w-full md:flex md:w-auto md:order-1 transition-all duration-200`}
                >
                    <ul className="flex flex-col p-4 md:p-0 mt-4 md:mt-0 font-medium md:space-x-8 md:flex-row bg-white/80 md:bg-transparent rounded-lg md:rounded-none shadow-lg md:shadow-none">
                        <li>
                            <a
                                href="#about"
                                onClick={closeMenu}
                                className="block py-3 px-4 md:py-2 md:px-3 text-emerald-700 hover:text-emerald-950 hover:bg-emerald-50 md:hover:bg-transparent md:p-0 transition-colors tracking-tight text-sm rounded-md md:rounded-none"
                            >
                                About
                            </a>
                        </li>
                        <li>
                            <a
                                href="#features"
                                onClick={closeMenu}
                                className="block py-3 px-4 md:py-2 md:px-3 text-emerald-700 hover:text-emerald-950 hover:bg-emerald-50 md:hover:bg-transparent md:p-0 transition-colors tracking-tight text-sm rounded-md md:rounded-none"
                            >
                                Features
                            </a>
                        </li>
                        <li>
                            <a
                                href="#process"
                                onClick={closeMenu}
                                className="block py-3 px-4 md:py-2 md:px-3 text-emerald-700 hover:text-emerald-950 hover:bg-emerald-50 md:hover:bg-transparent md:p-0 transition-colors tracking-tight text-sm rounded-md md:rounded-none"
                            >
                                How it Works
                            </a>
                        </li>
                        <li>
                            <a
                                href="#contact"
                                onClick={closeMenu}
                                className="block py-3 px-4 md:py-2 md:px-3 text-emerald-700 hover:text-emerald-950 hover:bg-emerald-50 md:hover:bg-transparent md:p-0 transition-colors tracking-tight text-sm rounded-md md:rounded-none"
                            >
                                Support
                            </a>
                        </li>
                        {/* Mobile-only login link */}
                        <li className="md:hidden border-t border-emerald-100 mt-2 pt-2">
                            <Link
                                href="/login"
                                onClick={closeMenu}
                                className="block py-3 px-4 text-emerald-800 hover:text-emerald-950 hover:bg-emerald-50 font-medium text-sm transition-colors rounded-md"
                            >
                                Login
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    )
}
