import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CookiePolicyPage() {
  return (
    <div className="animate-in max-w-4xl mx-auto px-6 py-12">
      {/* Back Link */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 mb-8 text-sm font-medium"
        style={{ color: "var(--accent-blue)" }}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      {/* Page Header */}
      <div className="mb-12">
        <h1
          className="text-4xl font-bold mb-3"
          style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
        >
          Cookie Policy
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>Last updated: February 2, 2026</p>
      </div>

      {/* Content */}
      <div className="prose prose-lg max-w-none space-y-8">
        {/* Introduction */}
        <section>
          <p style={{ color: "var(--text-primary)", lineHeight: "1.8" }}>
            This Cookie Policy explains how PodBrain Inc. ("we", "us", or "our") uses cookies and
            similar tracking technologies when you visit getpodbrain.ai (the "Service"). This policy
            should be read alongside our Privacy Policy.
          </p>
        </section>

        {/* What Are Cookies */}
        <section>
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
          >
            What Are Cookies?
          </h2>
          <p style={{ color: "var(--text-primary)", lineHeight: "1.8" }}>
            Cookies are small text files that are stored on your device (computer, tablet, or mobile)
            when you visit a website. They help the website remember your actions and preferences
            (such as login credentials, language settings, and display preferences) over a period of
            time, so you don't have to re-enter them whenever you come back to the site or browse
            from one page to another.
          </p>
        </section>

        {/* Types of Cookies We Use */}
        <section>
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
          >
            Types of Cookies We Use
          </h2>
          <p style={{ color: "var(--text-primary)", lineHeight: "1.8", marginBottom: "1rem" }}>
            We use the following categories of cookies on our Service:
          </p>

          <h3
            className="text-xl font-semibold mb-2 mt-6"
            style={{ color: "var(--text-primary)" }}
          >
            1. Essential Cookies
          </h3>
          <p style={{ color: "var(--text-primary)", lineHeight: "1.8", marginBottom: "1rem" }}>
            These cookies are necessary for the Service to function properly. They enable core
            functionality such as security, account authentication, and session management. You
            cannot opt out of these cookies as the Service would not work without them.
          </p>
          <ul
            className="list-disc pl-6 space-y-2"
            style={{ color: "var(--text-primary)", lineHeight: "1.8" }}
          >
            <li>
              <strong>Authentication cookies:</strong> Keep you logged in during your session
            </li>
            <li>
              <strong>Security cookies:</strong> Protect against cross-site request forgery and
              other security threats
            </li>
            <li>
              <strong>Session cookies:</strong> Maintain your session state while using the Service
            </li>
          </ul>

          <h3
            className="text-xl font-semibold mb-2 mt-6"
            style={{ color: "var(--text-primary)" }}
          >
            2. Functional Cookies
          </h3>
          <p style={{ color: "var(--text-primary)", lineHeight: "1.8", marginBottom: "1rem" }}>
            These cookies enable enhanced functionality and personalization, such as remembering your
            preferences and settings.
          </p>
          <ul
            className="list-disc pl-6 space-y-2"
            style={{ color: "var(--text-primary)", lineHeight: "1.8" }}
          >
            <li>
              <strong>Preference cookies:</strong> Remember your display settings and interface
              choices
            </li>
            <li>
              <strong>Language cookies:</strong> Store your language preferences
            </li>
          </ul>

          <h3
            className="text-xl font-semibold mb-2 mt-6"
            style={{ color: "var(--text-primary)" }}
          >
            3. Analytics Cookies
          </h3>
          <p style={{ color: "var(--text-primary)", lineHeight: "1.8", marginBottom: "1rem" }}>
            These cookies help us understand how visitors interact with our Service by collecting and
            reporting information anonymously. This helps us improve our Service.
          </p>
          <ul
            className="list-disc pl-6 space-y-2"
            style={{ color: "var(--text-primary)", lineHeight: "1.8" }}
          >
            <li>
              <strong>Usage analytics:</strong> Track page views, feature usage, and navigation
              patterns
            </li>
            <li>
              <strong>Performance monitoring:</strong> Measure load times and identify performance
              issues
            </li>
          </ul>
        </section>

        {/* Third-Party Cookies */}
        <section>
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
          >
            Third-Party Cookies
          </h2>
          <p style={{ color: "var(--text-primary)", lineHeight: "1.8", marginBottom: "1rem" }}>
            Some cookies are placed by third-party services that appear on our pages. We use the
            following third-party services:
          </p>
          <ul
            className="list-disc pl-6 space-y-2"
            style={{ color: "var(--text-primary)", lineHeight: "1.8" }}
          >
            <li>
              <strong>Supabase:</strong> For authentication and session management
            </li>
            <li>
              <strong>Stripe:</strong> For secure payment processing
            </li>
            <li>
              <strong>Vercel Analytics:</strong> For anonymous usage analytics (if enabled)
            </li>
          </ul>
          <p style={{ color: "var(--text-primary)", lineHeight: "1.8", marginTop: "1rem" }}>
            These third parties have their own privacy and cookie policies. We encourage you to
            review their policies for more information about their data practices.
          </p>
        </section>

        {/* Cookie Duration */}
        <section>
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
          >
            Cookie Duration
          </h2>
          <p style={{ color: "var(--text-primary)", lineHeight: "1.8", marginBottom: "1rem" }}>
            Cookies can be either session cookies or persistent cookies:
          </p>
          <ul
            className="list-disc pl-6 space-y-2"
            style={{ color: "var(--text-primary)", lineHeight: "1.8" }}
          >
            <li>
              <strong>Session cookies:</strong> Temporary cookies that are deleted when you close
              your browser
            </li>
            <li>
              <strong>Persistent cookies:</strong> Cookies that remain on your device for a set
              period (typically 30 days for authentication, up to 1 year for preferences)
            </li>
          </ul>
        </section>

        {/* Managing Cookies */}
        <section>
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
          >
            Managing Your Cookie Preferences
          </h2>
          <p style={{ color: "var(--text-primary)", lineHeight: "1.8", marginBottom: "1rem" }}>
            You have the right to decide whether to accept or reject cookies (except essential
            cookies required for the Service to function). You can manage your cookie preferences in
            the following ways:
          </p>
          <ul
            className="list-disc pl-6 space-y-2"
            style={{ color: "var(--text-primary)", lineHeight: "1.8" }}
          >
            <li>
              <strong>Browser settings:</strong> Most browsers allow you to control cookies through
              their settings. You can set your browser to refuse cookies or delete existing cookies.
            </li>
            <li>
              <strong>Private browsing:</strong> Using your browser's private/incognito mode will
              limit cookie storage to your current session.
            </li>
          </ul>
          <p style={{ color: "var(--text-primary)", lineHeight: "1.8", marginTop: "1rem" }}>
            Please note that disabling cookies may affect the functionality of our Service. Essential
            cookies cannot be disabled as they are necessary for the Service to operate.
          </p>
        </section>

        {/* Do Not Track */}
        <section>
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
          >
            Do Not Track Signals
          </h2>
          <p style={{ color: "var(--text-primary)", lineHeight: "1.8" }}>
            Our Service currently does not respond to "Do Not Track" (DNT) signals. However, you can
            configure your browser or use privacy-focused browser extensions to limit tracking as
            described above.
          </p>
        </section>

        {/* Updates */}
        <section>
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
          >
            Updates to This Policy
          </h2>
          <p style={{ color: "var(--text-primary)", lineHeight: "1.8" }}>
            We may update this Cookie Policy from time to time to reflect changes in our practices or
            for legal, operational, or regulatory reasons. When we make changes, we will update the
            "Last updated" date at the top of this policy. We encourage you to review this policy
            periodically.
          </p>
        </section>

        {/* Contact */}
        <section>
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
          >
            Contact Us
          </h2>
          <p style={{ color: "var(--text-primary)", lineHeight: "1.8" }}>
            If you have questions about our use of cookies or this Cookie Policy, please contact us
            at:
          </p>
          <p style={{ color: "var(--text-primary)", lineHeight: "1.8", marginTop: "1rem" }}>
            <strong>Email:</strong> privacy@getpodbrain.ai
            <br />
            <strong>Address:</strong> PodBrain Inc., [Address to be added]
          </p>
        </section>

        {/* Legal Disclaimer */}
        <section
          className="p-6 rounded-lg mt-8"
          style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-soft)" }}
        >
          <p style={{ color: "var(--text-secondary)", lineHeight: "1.8", fontSize: "0.875rem" }}>
            <strong>Disclaimer:</strong> This is placeholder legal content provided for reference
            purposes. Before launching your service, you must have this policy reviewed and approved
            by a qualified legal professional to ensure compliance with applicable laws and
            regulations, including GDPR, CCPA, and other privacy regulations.
          </p>
        </section>
      </div>

      {/* Footer Links */}
      <div className="mt-12 pt-8 border-t" style={{ borderColor: "var(--border-soft)" }}>
        <p style={{ color: "var(--text-secondary)" }}>
          See also:{" "}
          <Link href="/privacy" style={{ color: "var(--accent-blue)" }}>
            Privacy Policy
          </Link>{" "}
          |{" "}
          <Link href="/terms" style={{ color: "var(--accent-blue)" }}>
            Terms of Service
          </Link>
        </p>
      </div>
    </div>
  );
}
