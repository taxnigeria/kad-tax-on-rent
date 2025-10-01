"use client"

import Link from "next/link"
import { Button } from "@/ui/button"
import { Card, CardContent } from "@/ui/card"
import { Input } from "@/ui/input"
import { Textarea } from "@/ui/textarea"
import { Zap, Shield, Users, TrendingUp, Mail, Phone, MapPin } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border shadow-sm">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
                <Zap className="h-5 w-5 text-secondary-foreground" />
              </div>
              <span className="font-sans font-semibold text-lg text-foreground">YourSaaS</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#home" className="text-sm font-medium text-foreground hover:text-secondary transition-colors">
                Home
              </a>
              <a href="#about" className="text-sm font-medium text-foreground hover:text-secondary transition-colors">
                About Us
              </a>
              <a
                href="#features"
                className="text-sm font-medium text-foreground hover:text-secondary transition-colors"
              >
                Features
              </a>
              <a href="#contact" className="text-sm font-medium text-foreground hover:text-secondary transition-colors">
                Contact Us
              </a>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild>
                <Link href="/login">Log In</Link>
              </Button>
              <Button asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="pt-32 pb-20 px-4 lg:px-8 bg-gradient-to-br from-background to-muted">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="font-sans font-bold text-5xl lg:text-6xl text-foreground mb-6 text-balance">
                Transform Your Business with Modern Solutions
              </h1>
              <p className="text-lg text-muted-foreground mb-8 text-pretty leading-relaxed">
                Streamline your workflow, boost productivity, and scale your business with our powerful SaaS platform
                designed for modern teams.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                  Get Started
                </Button>
                <Button size="lg" variant="outline">
                  Learn More
                </Button>
              </div>
            </div>
            <div className="relative">
              <img src="/modern-dashboard.png" alt="Dashboard Preview" className="rounded-lg shadow-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-20 px-4 lg:px-8 bg-muted">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <img src="/team-collaboration.png" alt="About Us" className="rounded-lg shadow-lg" />
            </div>
            <div>
              <h2 className="font-sans font-bold text-4xl text-foreground mb-6">About Us</h2>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                We are a team of passionate innovators dedicated to building tools that empower businesses to achieve
                their full potential. Our mission is to simplify complex workflows and provide intuitive solutions that
                drive real results.
              </p>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                With years of experience in the industry, we understand the challenges modern businesses face. That's
                why we've created a platform that combines powerful features with an easy-to-use interface.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-secondary mb-2">10K+</div>
                    <div className="text-sm text-muted-foreground">Active Users</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-secondary mb-2">99.9%</div>
                    <div className="text-sm text-muted-foreground">Uptime</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 lg:px-8 bg-background">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-sans font-bold text-4xl text-foreground mb-4">Powerful Features</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
              Everything you need to run your business efficiently, all in one place.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="font-sans font-semibold text-xl text-foreground mb-2">Lightning Fast</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Experience blazing fast performance with our optimized infrastructure.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="font-sans font-semibold text-xl text-foreground mb-2">Secure & Reliable</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Enterprise-grade security to keep your data safe and protected.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="font-sans font-semibold text-xl text-foreground mb-2">Team Collaboration</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Work together seamlessly with powerful collaboration tools.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="font-sans font-semibold text-xl text-foreground mb-2">Analytics & Insights</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Make data-driven decisions with comprehensive analytics.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section id="contact" className="py-20 px-4 lg:px-8 bg-background">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="font-sans font-bold text-4xl text-foreground mb-4">Get In Touch</h2>
            <p className="text-lg text-muted-foreground text-pretty">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <Card>
                <CardContent className="pt-6">
                  <form className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                        Name
                      </label>
                      <Input id="name" placeholder="Your name" />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                        Email
                      </label>
                      <Input id="email" type="email" placeholder="your@email.com" />
                    </div>
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                        Message
                      </label>
                      <Textarea id="message" placeholder="Your message" rows={5} />
                    </div>
                    <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Email</h3>
                  <p className="text-muted-foreground">contact@yoursaas.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Phone</h3>
                  <p className="text-muted-foreground">+1 (555) 123-4567</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Address</h3>
                  <p className="text-muted-foreground">
                    123 Business Street
                    <br />
                    San Francisco, CA 94102
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 lg:px-8 bg-muted border-t border-border">
        <div className="container mx-auto text-center">
          <p className="text-sm text-muted-foreground">© 2025 YourSaaS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
