"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Building2, ShieldCheck, ArrowRight, Search, ScrollText, BellRing } from "lucide-react"

export function HeroSection() {
    return (
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-[#F0FDF4] bg-grid-corporate border-b border-emerald-100">
            <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
                <div className="fade-in-up z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-xs font-medium mb-8 tracking-wide uppercase backdrop-blur-sm">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.5} />
                        KADIRS Authorized Compliance Consultants
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-medium tracking-tighter text-emerald-950 mb-6 leading-[1.05]">
                        Simplified Rent
                        <br />
                        <span className="text-emerald-600/70">Tax Collection.</span>
                        <br />
                        Login & Pay.
                    </h1>
                    <p className="text-lg text-emerald-700/80 mb-10 max-w-lg leading-relaxed font-light">
                        The official digital platform for the collection and administration of Witholding Tax on Rent in Kaduna State. Access
                        your dashboard to manage properties and payments.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                            asChild
                            className="inline-flex items-center justify-center px-8 py-3 text-sm tracking-wide font-medium text-white bg-emerald-900 rounded-md hover:bg-emerald-800 shadow-lg shadow-emerald-200/50"
                        >
                            <Link href="/login">
                                Login to Dashboard
                                <ArrowRight className="w-4 h-4 ml-2" strokeWidth={1.5} />
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            asChild
                            className="inline-flex items-center justify-center px-8 py-3 text-sm tracking-wide font-medium text-emerald-800 bg-[#F0FDF4] border border-emerald-200 rounded-md hover:bg-emerald-50 hover:border-emerald-300"
                        >
                            <Link href="#verify">
                                <Search className="w-4 h-4 mr-2" strokeWidth={1.5} />
                                Verify TCC/Receipt
                            </Link>
                        </Button>
                    </div>
                </div>

                <div
                    className="relative lg:h-[700px] flex items-center justify-center fade-in-up"
                    style={{ animationDelay: "0.2s" }}
                >
                    {/* Dashboard Mockup */}
                    <div className="relative w-full max-w-md">
                        {/* Main Dashboard Card */}
                        <div className="bg-white rounded-xl shadow-2xl shadow-emerald-900/10 border border-emerald-100 overflow-hidden">
                            {/* Dashboard Header */}
                            <div className="bg-emerald-900 px-4 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 bg-white/20 rounded flex items-center justify-center">
                                        <Building2 className="w-3.5 h-3.5 text-white" strokeWidth={1.5} />
                                    </div>
                                    <span className="text-white text-xs font-medium">Tax Portal Dashboard</span>
                                </div>
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                                </div>
                            </div>

                            {/* Dashboard Content */}
                            <div className="p-4 space-y-4">
                                {/* Stats Row */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                                        <p className="text-[10px] text-emerald-600 font-medium uppercase tracking-wide">Properties</p>
                                        <p className="text-xl font-semibold text-emerald-900 mt-1">12</p>
                                    </div>
                                    <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                                        <p className="text-[10px] text-emerald-600 font-medium uppercase tracking-wide">Paid</p>
                                        <p className="text-xl font-semibold text-emerald-900 mt-1">₦2.4M</p>
                                    </div>
                                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                                        <p className="text-[10px] text-amber-600 font-medium uppercase tracking-wide">Pending</p>
                                        <p className="text-xl font-semibold text-amber-900 mt-1">₦650K</p>
                                    </div>
                                </div>

                                {/* Chart Placeholder */}
                                <div className="bg-gray-50 rounded-lg border border-gray-100 p-3">
                                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide mb-2">
                                        Payment History
                                    </p>
                                    <div className="flex items-end justify-between h-16 gap-1">
                                        <div className="bg-emerald-200 rounded-t w-full h-[30%]" />
                                        <div className="bg-emerald-300 rounded-t w-full h-[50%]" />
                                        <div className="bg-emerald-400 rounded-t w-full h-[70%]" />
                                        <div className="bg-emerald-500 rounded-t w-full h-[45%]" />
                                        <div className="bg-emerald-400 rounded-t w-full h-[85%]" />
                                        <div className="bg-emerald-600 rounded-t w-full h-[100%]" />
                                    </div>
                                </div>

                                {/* Property List Header */}
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">My Properties</p>
                                    <span className="text-[9px] text-emerald-600 font-medium">View All</span>
                                </div>

                                {/* Property List */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-emerald-100 rounded flex items-center justify-center">
                                                <Building2 className="w-4 h-4 text-emerald-700" strokeWidth={1.5} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-900">15 Ahmadu Bello Way</p>
                                                <p className="text-[10px] text-gray-500">Kaduna North</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                            Paid
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-emerald-100 rounded flex items-center justify-center">
                                                <Building2 className="w-4 h-4 text-emerald-700" strokeWidth={1.5} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-900">7 Rabah Road</p>
                                                <p className="text-[10px] text-gray-500">Barnawa</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                            Pending
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Cards */}
                        <div className="absolute -top-6 right-0 lg:-right-8 float-card-1 z-10 hidden sm:block">
                            <div className="bg-white rounded-lg shadow-xl shadow-emerald-900/10 border border-emerald-100 p-3 w-48">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-emerald-600 font-medium">Payment Successful</p>
                                        <p className="text-sm font-semibold text-gray-900">₦650,000</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="absolute top-1/4 left-0 lg:-left-12 float-card-2 z-10 hidden sm:block">
                            <div className="bg-white rounded-lg shadow-xl shadow-emerald-900/10 border border-emerald-100 p-3 w-44">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-7 h-7 bg-blue-100 rounded flex items-center justify-center">
                                        <ScrollText className="w-3.5 h-3.5 text-blue-600" strokeWidth={1.5} />
                                    </div>
                                    <p className="text-[10px] font-medium text-gray-700">New Invoice</p>
                                </div>
                                <p className="text-[9px] text-gray-500 font-mono">REF: KAD-2025-0847</p>
                                <p className="text-sm font-semibold text-gray-900 mt-1">₦320,000</p>
                            </div>
                        </div>

                        <div className="absolute -bottom-4 right-0 lg:-right-6 float-card-4 z-10 hidden sm:block">
                            <div className="bg-white rounded-lg shadow-xl shadow-emerald-900/10 border border-emerald-100 p-2.5 flex items-center gap-2">
                                <div className="relative">
                                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                                        <BellRing className="w-4 h-4 text-amber-600" strokeWidth={1.5} />
                                    </div>
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                                        3
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-medium text-gray-700">New Invoices</p>
                                    <p className="text-[9px] text-gray-400">Due in 7 days</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Background blurs */}
                    <div className="absolute -z-10 top-20 right-20 w-72 h-72 bg-emerald-200/40 rounded-full blur-[100px]" />
                    <div className="absolute -z-10 bottom-10 left-10 w-64 h-64 bg-teal-200/40 rounded-full blur-[80px]" />
                </div>
            </div>
        </section>
    )
}
