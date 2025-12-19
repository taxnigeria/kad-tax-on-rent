"use client"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Building2,
  ShieldCheck,
  ArrowRight,
  Search,
  Calculator,
  Lock,
  ScrollText,
  Scale,
  BellRing,
  UserPlus,
  Banknote,
  FileCheck,
  Star,
  Play,
  ArrowUpRight,
  Menu,
} from "lucide-react"

import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useEffect } from "react"

export default function LandingPage() {
  const router = useRouter()
  const { user, userRole, loading } = useAuth()

  useEffect(() => {
    if (loading) return

    if (user && userRole) {
      // Redirect based on role
      if (userRole === "admin" || userRole === "super_admin") {
        router.push("/admin")
      } else if (userRole === "enumerator") {
        router.push("/enumerator-dashboard")
      } else {
        router.push("/taxpayer-dashboard")
      }
    }
  }, [user, userRole, loading, router])

  if (user && userRole && !loading) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#F0FDF4] text-emerald-950 antialiased selection:bg-emerald-200 selection:text-emerald-900">
      {/* Custom Styles */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        .bg-grid-corporate {
          background-size: 40px 40px;
          background-image: linear-gradient(to right, rgba(16, 185, 129, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(16, 185, 129, 0.05) 1px, transparent 1px);
        }
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradientMove 6s ease infinite;
        }
        /* Slowed down floating animations significantly (10-14s instead of 3.5-5s) */
        @keyframes float1 {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50% { transform: translateY(-8px) rotate(0deg); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0px) rotate(0.5deg); }
          50% { transform: translateY(-10px) rotate(1deg); }
        }
        @keyframes float3 {
          0%, 100% { transform: translateY(0px) rotate(-0.5deg); }
          50% { transform: translateY(-6px) rotate(0deg); }
        }
        @keyframes float4 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        .float-card-1 {
          animation: float1 10s ease-in-out infinite;
        }
        .float-card-2 {
          animation: float2 12s ease-in-out infinite;
          animation-delay: 1s;
        }
        .float-card-3 {
          animation: float3 11s ease-in-out infinite;
          animation-delay: 2s;
        }
        .float-card-4 {
          animation: float4 14s ease-in-out infinite;
          animation-delay: 0.5s;
        }
      `}</style>

      {/* Navigation */}
      <nav className="fixed w-full z-50 top-0 start-0 border-b border-emerald-100 bg-[#F0FDF4]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-9 w-9 bg-emerald-800 text-white flex items-center justify-center rounded-sm font-semibold text-lg tracking-tighter shadow-sm">
              <Building2 className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-emerald-950 leading-none">
                Kad Tax on Rent
              </span>
              <span className="text-[10px] text-emerald-600 font-medium tracking-wide uppercase mt-0.5">
                Authorized Partner
              </span>
            </div>
          </Link>

          <div className="flex md:order-2 space-x-3 items-center">
            <Link
              href="/login"
              className="hidden md:block text-emerald-800 hover:text-emerald-950 font-medium text-sm transition-colors"
            >
              Login
            </Link>
            <Button
              asChild
              className="bg-emerald-900 hover:bg-emerald-800 text-white rounded-md text-sm px-5 py-2 shadow-sm shadow-emerald-200/50 tracking-tight"
            >
              <Link href="/signup">Create Account</Link>
            </Button>
            <button className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-emerald-800 rounded-lg md:hidden hover:bg-emerald-100">
              <Menu className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>

          <div className="items-center justify-between hidden w-full md:flex md:w-auto md:order-1">
            <ul className="flex flex-col p-4 md:p-0 mt-4 font-medium md:space-x-8 md:flex-row md:mt-0">
              <li>
                <a
                  href="#about"
                  className="block py-2 px-3 text-emerald-700 hover:text-emerald-950 md:p-0 transition-colors tracking-tight text-sm"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  className="block py-2 px-3 text-emerald-700 hover:text-emerald-950 md:p-0 transition-colors tracking-tight text-sm"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#process"
                  className="block py-2 px-3 text-emerald-700 hover:text-emerald-950 md:p-0 transition-colors tracking-tight text-sm"
                >
                  How it Works
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  className="block py-2 px-3 text-emerald-700 hover:text-emerald-950 md:p-0 transition-colors tracking-tight text-sm"
                >
                  Support
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
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
              The official digital platform for the collection and administration of Tax on Rent in Kaduna State. Access
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

                {/* Dashboard Content - Extended content for taller layout */}
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
                    <div className="flex justify-between mt-2 text-[8px] text-gray-400">
                      <span>Jan</span>
                      <span>Feb</span>
                      <span>Mar</span>
                      <span>Apr</span>
                      <span>May</span>
                      <span>Jun</span>
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
                    <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-100 rounded flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-emerald-700" strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-900">23 Sultan Road</p>
                          <p className="text-[10px] text-gray-500">Unguwar Rimi</p>
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
                          <p className="text-xs font-medium text-gray-900">12 Katsina Road</p>
                          <p className="text-[10px] text-gray-500">Malali</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                        Overdue
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Card 1 - Payment Success */}
              <div className="absolute -top-6 right-0 lg:-right-8 float-card-1 z-10 hidden sm:block">
                <div className="bg-white rounded-lg shadow-xl shadow-emerald-900/10 border border-emerald-100 p-3 w-48">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] text-emerald-600 font-medium">Payment Successful</p>
                      <p className="text-sm font-semibold text-gray-900">₦650,000</p>
                    </div>
                  </div>
                  <div className="text-[9px] text-gray-400">Just now</div>
                </div>
              </div>

              {/* Floating Card 2 - Invoice */}
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

              {/* Floating Card 3 - Property Added */}
              <div className="absolute bottom-1/4 left-0 lg:-left-6 float-card-3 z-10 hidden sm:block">
                <div className="bg-white rounded-lg shadow-xl shadow-emerald-900/10 border border-emerald-100 p-3 w-48">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-purple-600" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-[10px] text-purple-600 font-medium">Property Added</p>
                      <p className="text-[9px] text-gray-500 truncate w-28">23 Sultan Road, Unguwar...</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Card 4 - Notification Badge */}
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

      {/* Partners */}
      <section className="py-12 border-b border-emerald-100 bg-[#ecfdf5]">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs font-semibold tracking-[0.2em] text-emerald-500 uppercase mb-10">
            Secured Payment Partners
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-16 gap-y-10 opacity-70 grayscale hover:grayscale-0 transition-all duration-500 mix-blend-multiply">
            <span className="text-xl font-semibold tracking-tight text-emerald-800">INTERSWITCH</span>
            <span className="text-xl font-semibold tracking-tight text-emerald-800">REMITA</span>
            <span className="text-xl font-semibold tracking-tight text-emerald-800">PAYKADUNA</span>
            <span className="text-xl font-semibold tracking-tight text-emerald-800">ZENITH BANK</span>
            <span className="text-xl font-semibold tracking-tight text-emerald-800">ACCESS BANK</span>
            <span className="text-xl font-semibold tracking-tight text-emerald-800">KADIRS</span>
          </div>
        </div>
      </section>

      {/* About Section */}
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

      {/* Features Section */}
      <section id="features" className="py-24 bg-white border-y border-emerald-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mb-16">
            <h2 className="text-3xl lg:text-4xl font-medium tracking-tighter text-emerald-950 mb-6">
              Why Choose Our KADIRS-Approved Platform?
            </h2>
            <p className="text-lg text-emerald-600/80 font-light leading-relaxed">
              Experience a modern, transparent, and secure way to manage your rental property tax obligations with tools
              designed for landlords and property managers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
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
            ].map((feature, i) => (
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

      {/* Process Section */}
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
            {[
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
            ].map((step, i) => (
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

      {/* Testimonials Section */}
      <section className="py-24 bg-[#F0FDF4] border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-medium tracking-tight text-center text-emerald-950 mb-16">
            Trusted by Property Owners
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote:
                  "The dashboard makes managing my three properties in Barnawa incredibly easy. I got my tax certificate instantly.",
                name: "Ahmed Musa",
                role: "Landlord, Kaduna North",
                initials: "AM",
              },
              {
                quote:
                  "Finally, a transparent system. The auto-calculation feature saved me from overpaying. Highly recommended.",
                name: "Sarah James",
                role: "Property Developer",
                initials: "SJ",
              },
              {
                quote:
                  "Seamless integration with Remita. I paid directly from my corporate account and printed the receipt immediately.",
                name: "Ibrahim Bello",
                role: "Real Estate Consultant",
                initials: "IB",
              },
            ].map((testimonial, i) => (
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

      {/* Tutorials Section */}
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
            {[
              { title: "How to Register a Property", duration: "03:42" },
              { title: "Generating Assessment ID", duration: "02:15" },
              { title: "Verifying Your Receipt", duration: "01:58" },
            ].map((video, i) => (
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

      {/* Support Section */}
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

          <div className="bg-[#F0FDF4] rounded-sm shadow-xl shadow-emerald-900/5 border border-emerald-200 p-8 md:p-12">
            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-4 py-3 bg-white border border-emerald-200 rounded-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-emerald-300/50 text-emerald-900"
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="tin" className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
                    Tax ID (TIN)
                  </label>
                  <input
                    type="text"
                    id="tin"
                    className="w-full px-4 py-3 bg-white border border-emerald-200 rounded-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-emerald-300/50 text-emerald-900"
                    placeholder="KDS..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="message" className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
                  Details
                </label>
                <textarea
                  id="message"
                  rows={4}
                  className="w-full px-4 py-3 bg-white border border-emerald-200 rounded-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-emerald-300/50 text-emerald-900"
                  placeholder="Describe your issue..."
                />
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-emerald-900 text-white font-semibold text-sm uppercase tracking-widest rounded-sm hover:bg-emerald-800 transition-all shadow-md"
              >
                Submit Ticket
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="overflow-hidden animate-gradient bg-emerald-900 pt-24 pb-24 relative">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMGg0MHY0MEg0MFYwWjFtMSAxaDM4VjM4SDFWMXoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvc3ZnPg==')] opacity-30" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-medium tracking-tighter text-white mb-6">Ready to get started?</h2>
          <p className="text-emerald-100 text-lg mb-10 font-light max-w-2xl mx-auto">
            Create your account today and experience the easiest way to manage your property tax obligations in Kaduna
            State.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              className="px-8 py-4 bg-white text-emerald-900 text-sm font-semibold rounded-md shadow-xl hover:bg-emerald-50 uppercase tracking-widest"
            >
              <Link href="/signup">Register Now</Link>
            </Button>
            <Button
              variant="outline"
              asChild
              className="px-8 py-4 bg-emerald-800/50 backdrop-blur-sm border border-emerald-400/30 text-white text-sm font-semibold rounded-md hover:bg-emerald-800 uppercase tracking-widest"
            >
              <Link href="/login">Login to Portal</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 pt-16 pb-8 text-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            {/* Brand Info */}
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

            {/* Quick Links */}
            <div>
              <h4 className="font-bold text-gray-900 mb-6">Quick Links</h4>
              <ul className="space-y-4 text-gray-500">
                <li>
                  <Link href="/signup" className="hover:text-emerald-700 transition-colors">
                    Create Account
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-emerald-700 transition-colors">
                    Login
                  </Link>
                </li>
                <li>
                  <a href="#process" className="hover:text-emerald-700 transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-emerald-700 transition-colors">
                    Benefits
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-bold text-gray-900 mb-6">Legal</h4>
              <ul className="space-y-4 text-gray-500">
                <li>
                  <a href="#" className="hover:text-emerald-700 transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-emerald-700 transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-emerald-700 transition-colors">
                    Data Protection
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
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

          {/* Bottom Bar */}
          <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-xs">© {new Date().getFullYear()} Kad Tax on Rent. All rights reserved.</p>
            <p className="text-gray-400 text-xs">A digital compliance solution for KADIRS.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .bg-grid-corporate {
          background-size: 50px 50px;
          background-image: linear-gradient(to right, rgba(5, 150, 105, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(5, 150, 105, 0.03) 1px, transparent 1px);
        }
        .text-gradient {
          background: linear-gradient(135deg, #065f46 0%, #059669 25%, #10b981 50%, #059669 75%, #065f46 100%);
          background-size: 400% 400%;
          animation: gradientMove 8s ease infinite;
        }
        @keyframes gradientMove {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
          opacity: 0;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes float1 {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-12px);
          }
        }
        @keyframes float2 {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        @keyframes float3 {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-14px);
          }
        }
        @keyframes float4 {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        .float-card-1 {
          animation: float1 10s ease-in-out infinite;
        }
        .float-card-2 {
          animation: float2 12s ease-in-out infinite;
          animation-delay: 1s;
        }
        .float-card-3 {
          animation: float3 14s ease-in-out infinite;
          animation-delay: 2s;
        }
        .float-card-4 {
          animation: float4 11s ease-in-out infinite;
          animation-delay: 0.5s;
        }
      `}</style>
    </div>
  )
}
