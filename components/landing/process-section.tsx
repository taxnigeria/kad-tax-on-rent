"use client"

import { UserPlus, Calculator, Banknote, FileCheck } from "lucide-react"

export function ProcessSection() {
    const steps = [
        {
            icon: UserPlus,
            title: "1. Create Account",
            desc: "Register as a landlord or agent. Link your TIN and property details accurately in the state database.",
        },
        {
            icon: Calculator,
            title: "2. Auto-Assessment",
            desc: "Our system automatically calculates your tax liability based on the declared rental value and applicable rates.",
        },
        {
            icon: Banknote,
            title: "3. Secure Payment",
            desc: "Pay securely using your debit card, bank transfer, or USSD via our integrated payment gateways.",
        },
        {
            icon: FileCheck,
            title: "4. Instant Receipt",
            desc: "Receive an instant electronic receipt and Tax Clearance Certificate (TCC) valid for official use.",
        },
    ]

    return (
        <section id="process" className="py-24 bg-[#e6f7ef] border-b border-emerald-100">
            <div className="max-w-7xl mx-auto px-6">
                <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-medium tracking-tight text-emerald-950">Payment Modalities</h2>
                        <p className="text-emerald-600 mt-2 text-lg font-light">Follow these steps to ensure full compliance.</p>
                    </div>
                    <div className="h-px bg-emerald-200 flex-1 ml-8 hidden md:block mb-2" />
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {steps.map((step, i) => (
                        <div
                            key={i}
                            className="bg-[#F0FDF4] p-8 rounded-sm border border-emerald-200 hover:border-emerald-600 hover:shadow-lg hover:shadow-emerald-100 transition-all duration-300 group relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-600 transform -translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                            <div className="w-12 h-12 bg-white rounded-sm flex items-center justify-center mb-6 text-emerald-800 group-hover:bg-emerald-600 group-hover:text-white transition-colors border border-emerald-100 group-hover:border-transparent">
                                <step.icon className="w-5 h-5" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-lg font-semibold text-emerald-900 mb-3">{step.title}</h3>
                            <p className="text-sm text-emerald-700/70 mb-6 leading-relaxed">{step.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
