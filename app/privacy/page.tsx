import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Privacy Policy | Kad Tax on Rent",
  description: "Privacy Policy for Kad Tax on Rent - Learn how we protect your data",
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-200 py-12">
        <div className="max-w-4xl mx-auto px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-800 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="prose prose-sm max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              Kad Tax on Rent ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your information when you visit our website and use
              our services in connection with the Kaduna State Internal Revenue Service (KADIRS).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
            <p className="text-gray-700 leading-relaxed mb-4">We collect information in the following ways:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>
                <strong>Account Information:</strong> Name, email address, phone number, and property details when you
                create an account
              </li>
              <li>
                <strong>Property Data:</strong> Information about rental properties including addresses, images, and tax
                calculations
              </li>
              <li>
                <strong>Usage Data:</strong> Pages visited, time spent, and interactions with our platform
              </li>
              <li>
                <strong>Device Information:</strong> IP address, browser type, operating system, and device identifiers
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Provide and maintain our tax calculation and property management services</li>
              <li>Process rental withholding tax submissions to KADIRS</li>
              <li>Generate tax invoices and compliance documents</li>
              <li>Communicate important updates and service notifications</li>
              <li>Improve our platform and user experience</li>
              <li>Comply with legal and regulatory requirements</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Security</h2>
            <p className="text-gray-700 leading-relaxed">
              We implement industry-standard security measures including encryption, secure authentication, and regular
              security audits to protect your personal information from unauthorized access, alteration, or disclosure.
              Your data is stored securely and access is restricted to authorized personnel only.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your information for as long as necessary to provide our services and comply with legal
              obligations. Tax records are maintained in accordance with Nigerian tax regulations and KADIRS
              requirements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Privacy Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-4">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Access your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data (where applicable)</li>
              <li>Object to processing of your information</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Third-Party Sharing</h2>
            <p className="text-gray-700 leading-relaxed">
              We share your information with KADIRS as required for tax compliance and regulatory purposes. We do not
              sell, rent, or share your personal information with unauthorized third parties. Service providers under
              confidentiality agreements may assist us, but they are prohibited from using your data for any other
              purpose.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Cookies and Tracking</h2>
            <p className="text-gray-700 leading-relaxed">
              We use cookies and similar tracking technologies to enhance your experience. You can control cookie
              settings through your browser preferences. Some features may not function properly if cookies are
              disabled.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about this Privacy Policy or our privacy practices, please contact us at:
            </p>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mt-4 text-sm">
              <p className="font-semibold text-gray-900 mb-2">Kad Tax on Rent</p>
              <p className="text-gray-700">Email: support@kadtaxonrent.com.ng</p>
              <p className="text-gray-700">Address: KADIRS Head Office, Independence Way, Kaduna</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Policy Updates</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy periodically to reflect changes in our practices or applicable laws. We
              will notify you of significant changes by updating the date at the top of this page.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
