"use client"

export function PartnersSection() {
    const partners = [
        "INTERSWITCH", "REMITA", "PAYKADUNA", "ZENITH BANK",
        "ACCESS BANK", "FIRST BANK", "GTB", "UBA", "ECOBANK", "KADIRS"
    ]

    return (
        <section className="py-12 border-b border-emerald-100 bg-[#ecfdf5]">
            <div className="max-w-7xl mx-auto px-6">
                <p className="text-center text-xs font-semibold tracking-[0.2em] text-emerald-500 uppercase mb-10">
                    Secured Payment Partners
                </p>
                <div className="w-full overflow-hidden">
                    <div className="auto-scroll flex gap-x-16 items-center whitespace-nowrap pb-2">
                        {[...partners, ...partners].map((partner, i) => (
                            <span key={i} className="text-xl font-semibold tracking-tight text-emerald-800 flex-shrink-0">
                                {partner}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
