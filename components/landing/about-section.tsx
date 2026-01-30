"use client"

import Image from "next/image"
import { ArrowUpRight } from "lucide-react"

export function AboutSection() {
    return (
        <section id="about" className="py-24 bg-[#F0FDF4] relative">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid md:grid-cols-2 gap-20 items-start">
                    <div className="relative group">
                        <div className="rounded-sm overflow-hidden bg-emerald-100 border border-emerald-200 shadow-xl group-hover:shadow-2xl transition-all duration-500">
                            <Image
                                src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=1000&auto=format&fit=crop"
                                alt="Financial Planning"
                                width={600}
                                height={400}
                                className="w-full h-auto object-cover contrast-110 group-hover:contrast-125 transition-all duration-700"
                            />
                        </div>
                        <div className="absolute -bottom-6 -right-6 bg-[#064e3b] p-6 rounded-sm shadow-lg border border-emerald-800 max-w-xs hidden lg:block">
                            <p className="text-sm text-emerald-100 italic font-mono border-l-2 border-emerald-500 pl-3">
                                "Tax compliance is the backbone of sustainable infrastructure development in Kaduna."
                            </p>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-3xl font-medium tracking-tight text-emerald-950 mb-8">Understanding Rent Tax</h2>
                        <div className="space-y-6 text-emerald-800/80 text-lg leading-relaxed font-light">
                            <p>
                                The Kaduna State Tax on Rent is a statutory obligation for landlords and property owners. It ensures
                                that a percentage of rental income is contributed towards state development.
                            </p>
                            <p>
                                <span className="text-emerald-950 font-medium border-b border-emerald-300">Compliance</span> is
                                mandatory. This portal simplifies calculation, filing, and payment, offering instant electronic
                                receipts and audit-ready history.
                            </p>
                        </div>
                        <div className="mt-10 flex gap-6">
                            <a
                                href="#"
                                className="text-sm font-semibold uppercase tracking-wider text-emerald-900 hover:text-emerald-600 flex items-center gap-1 group transition-colors"
                            >
                                Read Tax Law
                                <ArrowUpRight
                                    className="w-3.5 h-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                                    strokeWidth={1.5}
                                />
                            </a>
                            <a
                                href="#"
                                className="text-sm font-semibold uppercase tracking-wider text-emerald-900 hover:text-emerald-600 flex items-center gap-1 group transition-colors"
                            >
                                View Rate Card
                                <ArrowUpRight
                                    className="w-3.5 h-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                                    strokeWidth={1.5}
                                />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
