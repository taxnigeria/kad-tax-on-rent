"use client"

import { Play } from "lucide-react"

export function TutorialsSection() {
    const videos = [
        { title: "How to Register a Property", duration: "03:42" },
        { title: "Generating Assessment ID", duration: "02:15" },
        { title: "Verifying Your Receipt", duration: "01:58" },
    ]

    return (
        <section id="tutorials" className="py-24 bg-[#022c22] text-emerald-100 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-20" />
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-emerald-800/50 pb-6">
                    <div>
                        <h2 className="text-3xl font-medium tracking-tight text-white">Instructional Guides</h2>
                        <p className="text-emerald-400 mt-2 font-light">Learn how to navigate the tax portal efficiently.</p>
                    </div>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    {videos.map((video, i) => (
                        <div key={i} className="group relative cursor-pointer">
                            <div className="aspect-video bg-black rounded-sm overflow-hidden border border-emerald-800 flex items-center justify-center group-hover:border-emerald-500 transition-all shadow-2xl">
                                <div className="w-16 h-16 rounded-full bg-emerald-900/80 backdrop-blur-md flex items-center justify-center group-hover:bg-emerald-600 group-hover:scale-110 transition-all border border-emerald-500/30">
                                    <Play className="w-6 h-6 text-white fill-current" strokeWidth={1.5} />
                                </div>
                            </div>
                            <div className="mt-4 flex justify-between items-center border-t border-emerald-900 pt-3">
                                <p className="font-medium text-sm text-emerald-100">{video.title}</p>
                                <span className="text-xs text-emerald-600 font-mono">{video.duration}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
