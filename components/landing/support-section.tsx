"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"

export function SupportSection() {
    return (
        <section id="contact" className="py-24 bg-[#e6f7ef] border-b border-emerald-100">
            <div className="max-w-4xl mx-auto px-6">
                <div className="text-center mb-12">
                    <div className="inline-block px-3 py-1 mb-4 rounded-full border border-emerald-200 bg-[#F0FDF4] text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                        Help Desk
                    </div>
                    <h2 className="text-3xl font-medium tracking-tighter text-emerald-950 mb-4">Support & Inquiries</h2>
                    <p className="text-emerald-700 max-w-2xl mx-auto font-light">
                        Having trouble with your assessment? Submit a query to the KADIRS specialized rent tax unit.
                    </p>
                </div>
                <div className="flex justify-center">
                    <Button asChild className="bg-emerald-900 hover:bg-emerald-800 text-white px-8 py-3 rounded-md">
                        <Link href="/login">Login to Portal</Link>
                    </Button>
                </div>
            </div>
        </section>
    )
}
