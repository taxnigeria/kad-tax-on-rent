"use client"

import Link from "next/link"
import { Button } from "@/ui/button"
import { Card, CardContent } from "@/ui/card"
import {
  Building2,
  Shield,
  FileCheck,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  MapPin,
  MessageSquare,
  UserPlus,
  Home,
  BadgeCheck,
  Receipt,
  Banknote,
} from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-foreground leading-none">KTR</span>
                <span className="text-xs text-muted-foreground">Kaduna Tax on Rent Portal</span>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 lg:px-8 bg-gradient-to-br from-background via-primary/5 to-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <CheckCircle2 className="h-4 w-4" />
              Official KADIRS Platform
            </div>
            <h1 className="font-bold text-4xl md:text-5xl lg:text-6xl text-foreground mb-6 text-balance">
              Simplified Withholding Tax
              <br />
              <span className="text-primary">on Rent Collection</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto text-pretty leading-relaxed">
              Property owners and managers in Kaduna State can now easily self-assess, comply with tax regulations, and
              make secure payments online through the official KADIRS platform.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/signup">
                  Register Now <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#how-it-works">Learn How It Works</Link>
              </Button>
            </div>
          </div>

          {/* Hero Image/Illustration */}
          <div className="relative mt-16">
            <div className="rounded-2xl border-2 border-border bg-card shadow-2xl overflow-hidden">
              <img src="/images/design-mode/v0_image-2.jpg" alt="KADIRS Tax Portal Dashboard" className="w-full h-auto" />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 lg:px-8 bg-muted/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="font-bold text-3xl md:text-4xl text-foreground mb-4">Why Choose KADIRS Tax Portal?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience a modern, transparent, and secure way to manage your rental property tax obligations
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-border hover:shadow-lg transition-all hover:border-primary/50">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <FileCheck className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-xl text-foreground mb-2">Easy Self-Assessment</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Simple step-by-step process to calculate and assess your withholding tax on rental income without
                  hassle.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-lg transition-all hover:border-primary/50">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-xl text-foreground mb-2">Secure Online Payments</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Make payments safely through our encrypted platform with multiple payment options available.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-lg transition-all hover:border-primary/50">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-xl text-foreground mb-2">Full Compliance</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Stay compliant with Kaduna State tax laws and regulations through our government-backed platform.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-lg transition-all hover:border-primary/50">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-xl text-foreground mb-2">Avoid Penalties</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Timely reminders and easy payment options help you avoid late payment penalties and interest charges.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-lg transition-all hover:border-primary/50">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Receipt className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-xl text-foreground mb-2">Transparent Process</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Track your submissions, view payment history, and download receipts anytime from your dashboard.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-lg transition-all hover:border-primary/50">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-xl text-foreground mb-2">Multiple Properties</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Manage tax obligations for multiple rental properties from a single, convenient dashboard.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 lg:px-8 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="font-bold text-3xl md:text-4xl text-foreground mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started in 5 simple steps and stay compliant with Kaduna State tax regulations
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-8 relative">
            {/* Step 1 */}
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mb-4 relative z-10">
                  1
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <UserPlus className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg text-foreground mb-2">Register</h3>
                <p className="text-sm text-muted-foreground">Create your account with basic information</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mb-4 relative z-10">
                  2
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Home className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg text-foreground mb-2">Add Property</h3>
                <p className="text-sm text-muted-foreground">Submit your rental property details</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mb-4 relative z-10">
                  3
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <BadgeCheck className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg text-foreground mb-2">Get Verified</h3>
                <p className="text-sm text-muted-foreground">KADIRS verifies your property information</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mb-4 relative z-10">
                  4
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Receipt className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg text-foreground mb-2">Receive Invoice</h3>
                <p className="text-sm text-muted-foreground">Get your tax invoice automatically</p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mb-4 relative z-10">
                  5
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Banknote className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg text-foreground mb-2">Make Payment</h3>
                <p className="text-sm text-muted-foreground">Pay securely online and get receipt</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 lg:px-8 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="font-bold text-3xl md:text-4xl mb-6 text-balance">Ready to Get Started?</h2>
          <p className="text-lg mb-8 text-primary-foreground/90 max-w-2xl mx-auto text-pretty">
            Join thousands of property owners in Kaduna State who are managing their rental tax obligations efficiently
            through our platform.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              asChild
              className="bg-background text-foreground hover:bg-background/90"
            >
              <Link href="/signup">
                Create Free Account <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
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
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 lg:px-8 bg-muted border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* About */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg">KADIRS</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Official Kaduna State Internal Revenue Service platform for withholding tax on rent collection.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/signup" className="text-muted-foreground hover:text-primary transition-colors">
                    Register
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="text-muted-foreground hover:text-primary transition-colors">
                    Login
                  </Link>
                </li>
                <li>
                  <Link href="#how-it-works" className="text-muted-foreground hover:text-primary transition-colors">
                    How It Works
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Contact Us</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">WhatsApp: +234 XXX XXX XXXX</span>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">KADIRS Office, Kaduna State, Nigeria</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Kaduna State Internal Revenue Service (KADIRS). All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground mt-2">kadtaxonrent.com.ng</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
