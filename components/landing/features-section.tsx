"use client"

import { Calculator, Lock, ScrollText, Scale, Building2, BellRing } from "lucide-react"

export function FeaturesSection() {
    const features = [
        {
            icon: Calculator,
            title: "Guided Tax Assessment",
            desc: "Automatically calculate withholding tax on rent using accurate, state-approved formulas. No spreadsheets or guesswork.",
        },
        {
            icon: Lock,
            title: "Secure Online Payments",
            desc: "Pay through bank transfers, cards, or approved channels. Every transaction is encrypted and traceable.",
        },
        {
            icon: ScrollText,
            title: "Official KADIRS Receipts",
            desc: "Instantly receive government-issued receipts and evidence of tax remittance — downloadable anytime.",
        },
        {
            icon: Scale,
            title: "Full Legal Compliance",
            desc: "Stay compliant with Kaduna State tax laws and avoid default penalties, audits, and disruptions.",
        },
        {
            icon: Building2,
            title: "Multiple Property Support",
            desc: "Manage several tenants, buildings, and rental portfolios from one unified dashboard.",
        },
        {
            icon: BellRing,
            title: "Penalty Prevention Alerts",
            desc: "Get automated reminders before due dates so you never incur avoidable charges or late fees again.",
        },
    ]

    return (
        <section id="features" className="py-24 bg-white border-y border-emerald-100">
            <div className="max-w-7xl mx-auto px-6">
                <div className="max-w-3xl mb-16">
                    <h2 className="text-3xl lg:text-4xl font-medium tracking-tighter text-emerald-950 mb-6">
                        How We Simplify Withholding Tax on Rent
                    </h2>
                    <p className="text-lg text-emerald-600/80 font-light leading-relaxed">
                        Experience a modern, transparent, and secure way to manage your rental property tax obligations with tools
                        designed for landlords and property managers.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, i) => (
                        <div
                            key={i}
                            className="p-6 rounded-xl border border-emerald-100 bg-[#F8FDF9] hover:border-emerald-200 transition-colors"
                        >
                            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 mb-4">
                                <feature.icon className="w-5 h-5" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-lg font-semibold text-emerald-950 mb-2 tracking-tight">{feature.title}</h3>
                            <p className="text-sm text-emerald-700/70 font-normal leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
