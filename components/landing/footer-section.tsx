"use client"

import Link from "next/link"
import { Building2, ShieldCheck } from "lucide-react"

export function FooterSection() {
    return (
        <footer className="bg-gray-50 border-t border-gray-200 pt-16 pb-8 text-sm">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid md:grid-cols-4 gap-12 mb-16">
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-emerald-600 text-white flex items-center justify-center rounded-md">
                                <Building2 className="w-5 h-5" strokeWidth={1.5} />
                            </div>
                            <span className="font-bold text-gray-900 text-lg tracking-tight">Kad Tax on Rent</span>
                        </div>
                        <p className="text-gray-500 leading-relaxed text-sm">
                            We are authorized consultants and digital compliance partners supporting Kaduna State Internal Revenue
                            Service (KADIRS) in withholding tax administration for rental properties.
                        </p>
                        <div className="flex items-center gap-2 text-emerald-700 text-xs font-medium">
                            <ShieldCheck className="w-4 h-4" strokeWidth={1.5} />
                            <span>KADIRS Authorized Partner</span>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-gray-900 mb-6">Quick Links</h4>
                        <ul className="space-y-4 text-gray-500">
                            <li>
                                <Link href="/signup" className="hover:text-emerald-700 transition-colors">Create Account</Link>
                            </li>
                            <li>
                                <Link href="/login" className="hover:text-emerald-700 transition-colors">Login</Link>
                            </li>
                            <li>
                                <a href="#process" className="hover:text-emerald-700 transition-colors">How It Works</a>
                            </li>
                            <li>
                                <a href="#features" className="hover:text-emerald-700 transition-colors">Benefits</a>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-gray-900 mb-6">Legal</h4>
                        <ul className="space-y-4 text-gray-500">
                            <li>
                                <Link href="/privacy" className="hover:text-emerald-700 transition-colors">Privacy Policy</Link>
                            </li>
                            <li>
                                <a href="#" className="hover:text-emerald-700 transition-colors">Terms of Service</a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-emerald-700 transition-colors">Data Protection</a>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-gray-900 mb-6">Contact KADIRS</h4>
                        <ul className="space-y-4 text-gray-500">
                            <li className="flex items-start gap-2">
                                <span className="font-medium text-gray-700">Address:</span>
                                <span>KADIRS Head Office, Independence Way, Kaduna</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-medium text-gray-700">Phone:</span>
                                <span>+234 (0) 800 123 4567</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-medium text-gray-700">Email:</span>
                                <span>support@kadtaxonrent.com.ng</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-400 text-xs">© {new Date().getFullYear()} Kad Tax on Rent. All rights reserved.</p>
                    <p className="text-gray-400 text-xs">A digital compliance solution for KADIRS.</p>
                </div>
            </div>
        </footer>
    )
}
