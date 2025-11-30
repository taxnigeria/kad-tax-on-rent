// app/components/LandingPage.tsx
"use client"

import React, { useCallback, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion"
import { Button } from "@/ui/button"
import { Card, CardContent } from "@/ui/card"
import {
  Building2,
  Shield,
  FileCheck,
  CreditCard,
  Receipt,
  Bell,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  UserPlus,
  Home,
  BadgeCheck,
  Banknote,
  MessageSquare,
  MapPin,
  Star,
} from "lucide-react"

export default function LandingPage() {
  // Mouse parallax for hero image
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const bounds = (e.target as HTMLElement).getBoundingClientRect()
    const x = (e.clientX - bounds.left) / bounds.width - 0.5
    const y = (e.clientY - bounds.top) / bounds.height - 0.5
    setMouse({ x, y })
  }, [])

  // Motion transforms
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  // map mouse to motion values (simple smoothing)
  mx.set(mouse.x * 12)
  my.set(mouse.y * 8)
  const rotY = useTransform(mx, (v) => `${-v}deg`)
  const rotX = useTransform(my, (v) => `${v}deg`)
  const scale = useTransform(mx, (v) => 1 + Math.abs(v) * 0.002)

  // framer-motion variants
  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-bold text-lg">Kad Tax on Rent</span>
                <span className="text-xs text-muted-foreground">KADIRS Authorized Platform</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                How It Works
              </Link>
              <Link href="#benefits" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Benefits
              </Link>
              <Link href="#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Support
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/signup">Create Account</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section
        className="pt-28 pb-20 px-4 lg:px-8 bg-gradient-to-br from-background via-primary/5 to-background"
        aria-label="Hero"
      >
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          >
            {/* Pill */}
            <motion.div variants={fadeUp} className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Shield className="h-4 w-4" />
                KADIRS Authorized Compliance Consultants
              </div>
            </motion.div>

            {/* Headline + CTA */}
            <motion.div variants={fadeUp} className="text-center max-w-4xl mx-auto">
              <h1 className="font-extrabold text-4xl md:text-6xl tracking-tight mb-6">
                Effortless Withholding Tax Compliance
                <br />
                <span className="text-primary">for Rental Properties in Kaduna State</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8">
                We help <strong className="text-foreground">landlords, property managers, and estate firms</strong> register
                with KADIRS, calculate withholding tax on rent, and remit payments online — accurately, securely, and
                without queues or penalties.
              </p>

              <div className="flex flex-wrap justify-center gap-4">
                <motion.div whileHover={{ scale: 1.02 }} variants={fadeUp}>
                  <Button size="lg" asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link href="/signup">
                      Create Free Account <ArrowRight className="h-5 w-5 ml-2" />
                    </Link>
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} variants={fadeUp}>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="#how-it-works">📘 See How It Works</Link>
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>

          {/* HERO IMAGE + PARALLAX */}
          <div
            onMouseMove={handleMouseMove}
            className="relative mt-16 md:mt-24 flex justify-center"
            aria-hidden
          >
            <motion.div
              style={{ rotateY: rotY, rotateX: rotX, scale }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
              className="relative w-full max-w-6xl"
            >
              {/* Browser Frame */}
              <div className="rounded-xl bg-card shadow-2xl border border-border overflow-hidden">
                {/* Browser bar */}
                <div className="flex items-center gap-2 h-10 px-4 border-b border-border bg-muted">
                  <span className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="w-3 h-3 rounded-full bg-yellow-400" />
                  <span className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="ml-4 text-xs text-muted-foreground">kadtaxonrent.com.ng/dashboard</span>
                </div>

                {/* Image placeholder - replace with your screenshot */}
                <div className="w-full aspect-[16/9] relative">
                  <Image
                    src="/images/hero-dashboard.png"
                    alt="Kaduna Rent Tax Dashboard"
                    fill
                    style={{ objectFit: "cover" }}
                    className="object-top"
                    priority={false}
                  />
                </div>
              </div>

              {/* Floating card */}
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.35 }}
                  className="absolute -bottom-8 right-6 bg-card rounded-xl shadow-lg border border-border p-4 w-64"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Tax Invoice Generated</p>
                      <p className="text-sm font-medium text-foreground">Invoice #KD-48293</p>
                    </div>
                    <div className="rounded-full bg-primary/10 p-2">
                      <Receipt className="h-5 w-5 text-primary" />
                    </div>
                  </div>

                  <div className="mb-1">
                    <p className="text-2xl font-bold text-primary">₦52,300</p>
                    <p className="text-xs text-muted-foreground">Withholding tax on rent</p>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Status</span>
                    <span className="text-xs font-semibold text-success bg-success/10 px-2 py-1 rounded">Paid</span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </section>

      {/* PROBLEM / WHY */}
      <section className="py-16 px-4 lg:px-8 bg-destructive/5 border-y border-destructive/20">
        <div className="container mx-auto max-w-5xl text-center">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="font-bold text-2xl md:text-3xl mb-4">Stop Guessing. Stop Queuing. Start Complying.</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Kaduna State requires withholding tax deductions on rental income. Failure to comply leads to{" "}
              <strong className="text-destructive">fines, interest charges, and enforcement actions</strong>. We make
              compliance simple, automated, and penalty-free.
            </p>
          </motion.div>
        </div>
      </section>

      {/* BENEFITS */}
      <section id="benefits" className="py-20 px-4 lg:px-8 bg-background">
        <div className="container mx-auto max-w-7xl">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }} variants={{ show: { transition: { staggerChildren: 0.06 } } }}>
            <motion.div variants={fadeUp} className="text-center mb-12">
              <h2 className="font-bold text-3xl md:text-4xl mb-4">Why Choose Our KADIRS-Approved Platform?</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Experience a modern, transparent, and secure way to manage your rental property tax obligations.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-border hover:shadow-lg transition-all hover:border-primary/50">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <FileCheck className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-xl mb-2">Guided Tax Assessment</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Automatically calculate withholding tax on rent using accurate, state-approved formulas. No
                    spreadsheets or guesswork.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border hover:shadow-lg transition-all hover:border-primary/50">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <CreditCard className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-xl mb-2">Secure Online Payments</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Pay through bank transfers, cards, or approved channels. Every transaction is encrypted and traceable.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border hover:shadow-lg transition-all hover:border-primary/50">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Receipt className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-xl mb-2">Official KADIRS Receipts</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Instantly receive government-issued receipts and evidence of tax remittance — downloadable anytime.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border hover:shadow-lg transition-all hover:border-primary/50">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-xl mb-2">Full Legal Compliance</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Stay compliant with Kaduna State tax laws and avoid default penalties, audits, and disruptions.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border hover:shadow-lg transition-all hover:border-primary/50">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-xl mb-2">Multiple Property Support</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Manage several tenants, buildings, and rental portfolios from one dashboard.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border hover:shadow-lg transition-all hover:border-primary/50">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Bell className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-xl mb-2">Penalty Prevention Alerts</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Get reminders before due dates so you never incur avoidable charges again.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border hover:shadow-lg transition-all hover:border-primary/50">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-xl mb-2">Transparent Reporting</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Track payments, view history, and download audit-ready reports on demand.
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      {/* TRUST & STATS */}
      <section className="py-16 px-4 lg:px-8 bg-muted/50">
        <div className="container mx-auto max-w-7xl">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
            <div className="text-center mb-10">
              <h2 className="font-bold text-3xl mb-4">Trusted by Property Owners Across Kaduna State</h2>
              <p className="text-lg text-muted-foreground">Join landlords and estate managers who rely on our platform.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <Card className="border-border bg-card">
                <CardContent className="pt-8 text-center">
                  <div className="text-4xl font-bold text-primary mb-2">92%</div>
                  <p className="text-sm text-muted-foreground">Faster compliance than manual KADIRS processing</p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="pt-8 text-center">
                  <div className="text-4xl font-bold text-primary mb-2">₦0</div>
                  <p className="text-sm text-muted-foreground">In penalties avoided through timely reminders</p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="pt-8 text-center">
                  <div className="text-4xl font-bold text-primary mb-2">24/7</div>
                  <p className="text-sm text-muted-foreground">Access your dashboard and documents anytime</p>
                </CardContent>
              </Card>
            </div>

            {/* Testimonials */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-border bg-card">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 leading-relaxed italic">
                    "This platform made tax compliance so easy. I used to spend hours at KADIRS office; now everything is
                    done online in minutes."
                  </p>
                  <div>
                    <p className="font-semibold">Mr. Ibrahim A.</p>
                    <p className="text-sm text-muted-foreground">Property Owner, Barnawa</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 leading-relaxed italic">
                    "Managing multiple properties was a nightmare before. Now I can track all my tax obligations from one
                    dashboard."
                  </p>
                  <div>
                    <p className="font-semibold">Mrs. Zainab M.</p>
                    <p className="text-sm text-muted-foreground">Estate Manager, Ungwan Rimi</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 px-4 lg:px-8 bg-background">
        <div className="container mx-auto max-w-7xl">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={{ show: { transition: { staggerChildren: 0.06 } } }}>
            <motion.div variants={fadeUp} className="text-center mb-12">
              <h2 className="font-bold text-3xl md:text-4xl mb-4">Get Compliant in Just 5 Steps</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                From registration to payment receipt — all online, no paperwork, no queues.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-5 gap-8 relative">
              {[
                {
                  n: 1,
                  icon: <UserPlus className="h-6 w-6 text-primary" />,
                  title: "Create Your Account",
                  desc: "Enter your basic landlord or company information",
                },
                {
                  n: 2,
                  icon: <Home className="h-6 w-6 text-primary" />,
                  title: "Add Your Properties",
                  desc: "Register rental units, tenants, and rent amounts",
                },
                {
                  n: 3,
                  icon: <BadgeCheck className="h-6 w-6 text-primary" />,
                  title: "Verification",
                  desc: "We confirm your information and sync with KADIRS",
                },
                {
                  n: 4,
                  icon: <Receipt className="h-6 w-6 text-primary" />,
                  title: "Receive Your Tax Invoice",
                  desc: "The system calculates withholding tax automatically",
                },
                {
                  n: 5,
                  icon: <Banknote className="h-6 w-6 text-primary" />,
                  title: "Make Secure Payment",
                  desc: "Pay online and receive official government receipts instantly",
                },
              ].map((s) => (
                <motion.div key={s.n} variants={fadeUp} className="flex flex-col items-center text-center">
                  <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mb-3">
                    {s.n}
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">{s.icon}</div>
                  <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button size="lg" asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/signup">Start Now — It's Free <ArrowRight className="h-5 w-5 ml-2" /></Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 lg:px-8 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="font-bold text-3xl md:text-4xl mb-6">Ready to Get Started?</h2>
            <p className="text-lg mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
              Join property owners across Kaduna State who have eliminated penalties, saved time, and achieved full tax
              compliance through our platform.
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                asChild
                className="bg-background text-foreground hover:bg-background/90"
              >
                <Link href="/signup">Create Free Account <ArrowRight className="h-5 w-5 ml-2" /></Link>
              </Button>

              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 bg-transparent"
              >
                <Link href="/login">Login to Existing Account</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contact" className="py-12 px-4 lg:px-8 bg-muted border-t border-border">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg">Kad Tax on Rent</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                We are authorized consultants and digital compliance partners supporting Kaduna State Internal Revenue
                Service (KADIRS) in withholding tax administration for rental properties.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-3 w-3 text-primary" />
                <span>KADIRS Authorized Partner</span>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/signup" className="text-muted-foreground hover:text-primary">Create Account</Link>
                </li>
                <li>
                  <Link href="/login" className="text-muted-foreground hover:text-primary">Login</Link>
                </li>
                <li>
                  <Link href="#how-it-works" className="text-muted-foreground hover:text-primary">How It Works</Link>
                </li>
                <li>
                  <Link href="#benefits" className="text-muted-foreground hover:text-primary">Benefits</Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="text-muted-foreground hover:text-primary">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-muted-foreground hover:text-primary">Terms of Service</Link></li>
                <li><Link href="/data-protection" className="text-muted-foreground hover:text-primary">Data Protection</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Contact & Support</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-muted-foreground">WhatsApp Support</p>
                    <p className="text-foreground font-medium">+234 XXX XXX XXXX</p>
                  </div>
                </li>

                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-muted-foreground">Office Address</p>
                    <p className="text-foreground">Kaduna, Nigeria</p>
                  </div>
                </li>

                <li className="text-muted-foreground">
                  <span className="font-medium text-foreground">Business Hours:</span> Mon-Fri, 8AM–5PM
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-muted-foreground text-center md:text-left">
                © {new Date().getFullYear()} Kad Tax on Rent — KADIRS Authorized Compliance Consultants. All rights reserved.
              </p>
              <p className="text-xs text-muted-foreground">kadtaxonrent.com.ng</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
