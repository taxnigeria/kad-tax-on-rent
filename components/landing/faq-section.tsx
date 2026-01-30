"use client"

import { ArrowUpRight } from "lucide-react"

export function FAQSection() {
    const faqs = [
        {
            question: "What is Withholding Tax on Rent?",
            answer: "Withholding Tax on Rent (WHT) is a statutory tax obligation on rental income. Property owners and landlords are required to remit a percentage of rental income to the Kaduna State Internal Revenue Service.",
        },
        {
            question: "Who is required to pay Withholding Tax on Rent?",
            answer: "All landlords and property owners who receive rental income within Kaduna State are required to register and pay Withholding Tax on Rent. This includes both residential and commercial properties.",
        },
        {
            question: "How do I register my property?",
            answer: "Visit the registration section on our platform, provide your property details, upload supporting documents, and generate your assessment ID. Our instructional guide video walks you through each step.",
        },
        {
            question: "What documents do I need to register?",
            answer: "Typically, you'll need proof of ownership, property photos, tenant information, lease agreements, and valid identification. Specific requirements may vary based on property type.",
        },
        {
            question: "How is Withholding Tax on Rent calculated?",
            answer: "The tax is calculated using the official Kaduna State formula based on your annual rental income. Our platform automatically calculates accurate amounts - no manual calculations needed.",
        },
        {
            question: "Can I pay my tax online?",
            answer: "Yes! We support payments through multiple channels including banks, payment gateways, and REMITA. All payment methods are secure and immediately confirmed.",
        },
        {
            question: "What if I don't pay my tax on time?",
            answer: "Late payments may attract penalties and interest. We recommend paying before the deadline to avoid additional charges. You'll receive reminders through the platform.",
        },
        {
            question: "How do I get my assessment ID (KADIRS ID)?",
            answer: "After registering and verifying your phone and email, you can generate your assessment ID. This ID is essential for all tax transactions and inquiries.",
        },
    ]

    return (
        <section id="faq" className="py-24 bg-[#F0FDF4] border-b border-emerald-100">
            <div className="max-w-4xl mx-auto px-6">
                <div className="text-center mb-16">
                    <div className="inline-block px-3 py-1 mb-4 rounded-full border border-emerald-200 bg-white text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                        FAQ
                    </div>
                    <h2 className="text-3xl font-medium tracking-tighter text-emerald-950 mb-4">Frequently Asked Questions</h2>
                    <p className="text-emerald-700 max-w-2xl mx-auto font-light">
                        Find answers to common questions about Withholding Tax on Rent and using the Kad Tax platform.
                    </p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, i) => (
                        <details
                            key={i}
                            className="group border border-emerald-200 rounded-sm overflow-hidden hover:border-emerald-400 transition-colors bg-white"
                        >
                            <summary className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-emerald-50 transition-colors">
                                <span className="font-semibold text-emerald-950">{faq.question}</span>
                                <span className="text-emerald-600 group-open:rotate-180 transition-transform">
                                    <ArrowUpRight className="w-5 h-5" />
                                </span>
                            </summary>
                            <div className="px-6 py-4 border-t border-emerald-100 bg-emerald-50/50 text-emerald-800 text-sm leading-relaxed">
                                {faq.answer}
                            </div>
                        </details>
                    ))}
                </div>
            </div>
        </section>
    )
}
