import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Privacy Policy | Kad Tax on Rent",
  description: "Privacy Policy for Kad Tax on Rent - KADIRS Authorized Compliance Platform",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F0FDF4] text-emerald-950 antialiased">
      {/* Header */}
      <header className="fixed w-full z-50 top-0 border-b border-emerald-100 bg-[#F0FDF4]/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-5 h-5 text-emerald-800" strokeWidth={1.5} />
            <span className="text-sm font-medium text-emerald-800">Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="mb-12">
            <h1 className="text-4xl lg:text-5xl font-medium tracking-tight text-emerald-950 mb-4">Privacy Policy</h1>
            <p className="text-lg text-emerald-700/70">
              Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>

          <article className="prose prose-emerald max-w-none space-y-8 text-emerald-900">
            <section>
              <h2 className="text-2xl font-semibold text-emerald-950 mb-4">1. Introduction</h2>
              <p className="text-lg leading-relaxed text-emerald-800/80">
                Kad Tax on Rent ("Company", "we", "our", or "us") operates the website and application at
                www.kadtaxonrent.com.ng (the "Service"). This Privacy Policy outlines our policies regarding the
                collection, use, and disclosure of personal data when you use our Service and your associated legal
                rights.
              </p>
              <p className="text-lg leading-relaxed text-emerald-800/80">
                We are authorized compliance consultants for the KADIRS (Kaduna Internal Revenue Service) tax collection
                platform. Your trust is important to us, and we are committed to protecting your privacy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-emerald-950 mb-4">2. Information Collection and Use</h2>
              <p className="text-lg leading-relaxed text-emerald-800/80 mb-4">
                We collect various types of information in connection with the services we provide, including:
              </p>
              <ul className="space-y-3 ml-6 text-lg text-emerald-800/80">
                <li className="flex gap-3">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>
                    <strong>Personal Information:</strong> Name, email address, phone number, and physical address
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>
                    <strong>Property Information:</strong> Details of properties you own or manage for tax purposes
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>
                    <strong>Financial Information:</strong> Payment details and transaction history
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>
                    <strong>Technical Data:</strong> IP address, browser type, pages visited, and usage patterns
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>
                    <strong>Identity Documents:</strong> Government-issued IDs and verification documents as required by
                    KADIRS
                  </span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-emerald-950 mb-4">3. Legal Basis for Processing</h2>
              <p className="text-lg leading-relaxed text-emerald-800/80">We process your personal data based on:</p>
              <ul className="space-y-3 ml-6 text-lg text-emerald-800/80">
                <li className="flex gap-3">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Your consent to process data for tax-related services</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Legal obligations under Nigerian tax law and KADIRS regulations</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Performance of the service agreement between you and the Company</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Our legitimate interests in maintaining platform security and preventing fraud</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-emerald-950 mb-4">4. Use of Information</h2>
              <p className="text-lg leading-relaxed text-emerald-800/80 mb-4">
                We use the information we collect for various purposes:
              </p>
              <ul className="space-y-3 ml-6 text-lg text-emerald-800/80">
                <li className="flex gap-3">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Processing and managing your tax payments and obligations</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Sending service-related announcements and updates</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Verifying your identity and preventing fraudulent activities</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Improving our Service and user experience</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Complying with legal and regulatory requirements</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Providing customer support and responding to inquiries</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-emerald-950 mb-4">5. Data Security</h2>
              <p className="text-lg leading-relaxed text-emerald-800/80">
                The security of your data is important to us, but no method of transmission over the Internet or
                electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your
                personal data, we cannot guarantee its absolute security. We implement industry-standard security
                measures including encryption, secure authentication, and regular security audits.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-emerald-950 mb-4">6. Sharing of Information</h2>
              <p className="text-lg leading-relaxed text-emerald-800/80 mb-4">
                We may share your information in the following circumstances:
              </p>
              <ul className="space-y-3 ml-6 text-lg text-emerald-800/80">
                <li className="flex gap-3">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>
                    <strong>With KADIRS:</strong> As required for tax administration and compliance
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>
                    <strong>With Service Providers:</strong> Third parties who assist in operating our platform and
                    providing services
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>
                    <strong>Legal Requirements:</strong> When required by law or to protect our rights and safety
                  </span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-emerald-950 mb-4">7. Data Retention</h2>
              <p className="text-lg leading-relaxed text-emerald-800/80">
                We retain your personal data for as long as necessary to fulfill the purposes outlined in this Privacy
                Policy or as required by applicable law. For tax-related information, we maintain records in accordance
                with Nigerian tax regulations, which typically require retention for a minimum of seven (7) years.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-emerald-950 mb-4">8. Your Rights</h2>
              <p className="text-lg leading-relaxed text-emerald-800/80 mb-4">You have the right to:</p>
              <ul className="space-y-3 ml-6 text-lg text-emerald-800/80">
                <li className="flex gap-3">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Access your personal data we hold</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Correct inaccurate data</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Request deletion of data (subject to legal obligations)</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Restrict processing of your data</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Receive a copy of your data in a portable format</span>
                </li>
              </ul>
              <p className="text-lg leading-relaxed text-emerald-800/80 mt-4">
                To exercise these rights, please contact us using the details provided in Section 10.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-emerald-950 mb-4">9. Cookies and Tracking Technologies</h2>
              <p className="text-lg leading-relaxed text-emerald-800/80">
                We use cookies and similar tracking technologies to enhance your experience on our platform. These
                include session cookies (which expire when you close your browser) and persistent cookies (which remain
                on your device). You can control cookie preferences through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-emerald-950 mb-4">10. Contact Us</h2>
              <p className="text-lg leading-relaxed text-emerald-800/80 mb-4">
                If you have questions about this Privacy Policy or our privacy practices, please contact us at:
              </p>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 space-y-3 text-lg">
                <p>
                  <strong className="text-emerald-950">Email:</strong>{" "}
                  <a href="mailto:privacy@kadtaxonrent.com.ng" className="text-emerald-600 hover:underline">
                    privacy@kadtaxonrent.com.ng
                  </a>
                </p>
                <p>
                  <strong className="text-emerald-950">Phone:</strong>{" "}
                  <a href="tel:+2348123456789" className="text-emerald-600 hover:underline">
                    +234 (0) 812 345 6789
                  </a>
                </p>
                <p>
                  <strong className="text-emerald-950">Address:</strong> Kaduna, Nigeria
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-emerald-950 mb-4">11. Changes to This Privacy Policy</h2>
              <p className="text-lg leading-relaxed text-emerald-800/80">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
                Privacy Policy on this page and updating the "Last updated" date at the top of this policy. Your
                continued use of the Service following the posting of revised Privacy Policy means that you accept and
                agree to the changes.
              </p>
            </section>

            <section className="pt-8 border-t border-emerald-200">
              <p className="text-sm text-emerald-600/80">
                © 2025 Kad Tax on Rent. All rights reserved. This website is operated by KADIRS Authorized Compliance
                Consultants.
              </p>
            </section>
          </article>
        </div>
      </main>
    </div>
  )
}
