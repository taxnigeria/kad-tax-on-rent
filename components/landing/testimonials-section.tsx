"use client"

import { Star } from "lucide-react"

export function TestimonialsSection() {
    const testimonials = [
        {
            quote: "The dashboard makes managing my three properties in Barnawa incredibly easy. I got my tax certificate instantly.",
            name: "Ahmed Musa",
            role: "Landlord, Kaduna North",
            initials: "AM",
        },
        {
            quote: "Finally, a transparent system. The auto-calculation feature saved me from overpaying. Highly recommended.",
            name: "Sarah James",
            role: "Property Developer",
            initials: "SJ",
        },
        {
            quote: "Seamless integration with Remita. I paid directly from my corporate account and printed the receipt immediately.",
            name: "Ibrahim Bello",
            role: "Real Estate Consultant",
            initials: "IB",
        },
    ]

    return (
        <section className="py-24 bg-[#F0FDF4] border-b border-emerald-100">
            <div className="max-w-7xl mx-auto px-6">
                <h2 className="text-3xl font-medium tracking-tight text-center text-emerald-950 mb-16">
                    Trusted by Property Owners
                </h2>
                <div className="grid md:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, i) => (
                        <div key={i} className="p-8 bg-white border border-emerald-100 rounded-lg shadow-sm">
                            <div className="flex gap-1 text-yellow-400 mb-4">
                                {[...Array(5)].map((_, j) => (
                                    <Star key={j} className="w-4 h-4 fill-current" />
                                ))}
                            </div>
                            <p className="text-emerald-800/80 font-light italic mb-6">"{testimonial.quote}"</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-sm">
                                    {testimonial.initials}
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-emerald-950">{testimonial.name}</div>
                                    <div className="text-xs text-emerald-600">{testimonial.role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
