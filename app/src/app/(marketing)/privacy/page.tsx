import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>Last updated: February 2, 2026</p>
      </div>

      {/* Content */}
      <div className="prose prose-lg max-w-none space-y-8">
        {/* Introduction */}
        <section>
          <p style={{ color: "var(--text-primary)", lineHeight: "1.8" }}>
            This Privacy Policy describes how PodBrain Inc. (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, uses,
            and shares your personal information when you use our services at getpodbrain.ai (the
            &quot;Service&quot;). By using the Service, you agree to the collection and use of information in
            accordance with this policy.
          </p>
        </section>

        {/* Information Collection */}
        <section>
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
          >
            Information We Collect
          </h2>
          <p style={{ color: "var(--text-primary)", lineHeight: "1.8", marginBottom: "1rem" }}>
            We collect several types of information to provide and improve our Service:
          </p>
          <ul
            className="list-disc pl-6 space-y-2"
            style={{ color: "var(--text-primary)", lineHeight: "1.8" }}
          >
            <li>
              <strong>Account Information:</strong> When you create an account, we collect your
              email address, name, and other profile details.
            </li>
            <li>
              <strong>Content Data:</strong> Audio files you upload, podcast metadata, generated
              transcripts, show notes, and custom vocabulary terms.
            </li>
            <li>
              <strong>Usage Data:</strong> Information about how you interact with our Service,
              including features used, pages visited, and timestamps.
            </li>
            <li>
              <strong>Payment Information:</strong> Billing details and payment card information
              (processed securely through Stripe).
            </li>
            <li>
              <strong>Technical Data:</strong> IP address, browser type, device information, and
              operating system.
            </li>
          </ul>
        </section>

        {/* Data Usage */}
        <section>
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
          >
            How We Use Your Information
          </h2>
          <p style={{ color: "var(--text-primary)", lineHeight: "1.8", marginBottom: "1rem" }}>
            We use the collected information for the following purposes:
          </p>
          <ul
            className="list-disc pl-6 space-y-2"
            style={{ color: "var(--text-primary)", lineHeight: "1.8" }}
          >
            <li>Providing and maintaining the Service functionality</li>
            <li>Processing your podcast audio files and generating content assets</li>
            <li>Training AI models to improve transcription accuracy for your specific shows</li>
            <li>Communicating with you about service updates, features, and support</li>
            <li>Processing payments and managing subscriptions</li>
            <li>Analyzing usage patterns to improve user experience</li>
            <li>Detecting and preventing fraud, abuse, and technical issues</li>
            <li>Complying with legal obligations</li>
          </ul>
        </section>

        {/* Data Storage */}
        <section>
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
          >
            Data Storage and Security
          </h2>
          <p style={{ color: "var(--text-primary)", lineHeight: "1.8" }}>
            We store your data using Supabase (PostgreSQL) infrastructure with industry-standard
            encryption. Audio files are stored securely in cloud storage with access controls.
            While we implement reasonable security measures, no method of transmission over the
            Internet or electronic storage is 100% secure. We cannot guarantee absolute security.
          </p>
        </section>

        {/* Third-party Services */}
        <section>
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
          >
            Third-party Services
          </h2>
          <p style={{ color: "var(--text-primary)", lineHeight: "1.8", marginBottom: "1rem" }}>
            We use the following third-party services to operate our platform:
          </p>
          <ul
            className="list-disc pl-6 space-y-2"
            style={{ color: "var(--text-primary)", lineHeight: "1.8" }}
          >
            <li>
              <strong>AssemblyAI:</strong> For audio transcription processing
            </li>
            <li>
              <strong>xAI (Grok):</strong> For AI-powered content generation
            </li>
            <li>
              <strong>Stripe:</strong> For payment processing
            </li>
            <li>
              <strong>Supabase:</strong> For database and authentication services
            </li>
            <li>
              <strong>Resend:</strong> For transactional email delivery
            </li>
          </ul>
          <p
            style={{
              color: "var(--text-primary)",
              lineHeight: "1.8",
              marginTop: "1rem",
            }}
          >
            These services have their own privacy policies governing their use of your information.
          </p>
        </section>

        {/* Cookies */}
        <section>
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
          >
            Cookies and Tracking
          </h2>
          <p style={{ color: "var(--text-primary)", lineHeight: "1.8" }}>
            We use cookies and similar tracking technologies to track activity on our Service and
            hold certain information. Cookies are files with small amounts of data which may include
            an anonymous unique identifier. You can instruct your browser to refuse all cookies or
            to indicate when a cookie is being sent. However, if you do not accept cookies, you may
            not be able to use some portions of our Service.
          </p>
        </section>

        {/* User Rights */}
        <section>
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
          >
            Your Rights
          </h2>
          <p style={{ color: "var(--text-primary)", lineHeight: "1.8", marginBottom: "1rem" }}>
            You have the following rights regarding your personal information:
          </p>
          <ul
            className="list-disc pl-6 space-y-2"
            style={{ color: "var(--text-primary)", lineHeight: "1.8" }}
          >
            <li>
              <strong>Access:</strong> Request a copy of your personal data
            </li>
            <li>
              <strong>Rectification:</strong> Request correction of inaccurate data
            </li>
            <li>
              <strong>Deletion:</strong> Request deletion of your personal data
            </li>
            <li>
              <strong>Data Portability:</strong> Request transfer of your data to another service
            </li>
            <li>
              <strong>Withdrawal of Consent:</strong> Withdraw consent for data processing where
              applicable
            </li>
            <li>
              <strong>Objection:</strong> Object to processing of your personal data
            </li>
          </ul>
          <p
            style={{
              color: "var(--text-primary)",
              lineHeight: "1.8",
              marginTop: "1rem",
            }}
          >
            To exercise these rights, please contact us at privacy@getpodbrain.ai.
          </p>
        </section>

        {/* Data Retention */}
        <section>
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
          >
            Data Retention
          </h2>
          <p style={{ color: "var(--text-primary)", lineHeight: "1.8" }}>
            We retain your personal information only as long as necessary to fulfill the purposes
            outlined in this Privacy Policy. When you delete your account, we will delete or
            anonymize your personal data within 30 days, except where retention is required by law.
          </p>
        </section>

        {/* Children's Privacy */}
        <section>
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
          >
            Children&apos;s Privacy
          </h2>
          <p style={{ color: "var(--text-primary)", lineHeight: "1.8" }}>
            Our Service is not directed to individuals under the age of 18. We do not knowingly
            collect personal information from children. If you are a parent or guardian and believe
            your child has provided us with personal data, please contact us immediately.
          </p>
        </section>

        {/* Policy Changes */}
        <section>
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
          >
            Changes to This Privacy Policy
          </h2>
          <p style={{ color: "var(--text-primary)", lineHeight: "1.8" }}>
            We may update our Privacy Policy from time to time. We will notify you of any changes by
            posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. You
            are advised to review this Privacy Policy periodically for any changes. Changes are
            effective when posted on this page.
          </p>
        </section>

        {/* Contact Information */}
        <section>
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
          >
            Contact Us
          </h2>
          <p style={{ color: "var(--text-primary)", lineHeight: "1.8" }}>
            If you have any questions about this Privacy Policy, please contact us:
          </p>
          <ul
            className="list-none pl-0 space-y-2 mt-4"
            style={{ color: "var(--text-primary)", lineHeight: "1.8" }}
          >
            <li>Email: privacy@getpodbrain.ai</li>
            <li>Website: getpodbrain.ai</li>
          </ul>
        </section>

        {/* Notice */}
        <div
          className="alert-card info mt-12"
          style={{ backgroundColor: "rgba(0, 122, 255, 0.05)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-primary)", margin: 0 }}>
            <strong>Note:</strong> This is placeholder legal content. Before launch, this Privacy
            Policy must be reviewed by qualified legal counsel to ensure compliance with applicable
            laws including GDPR, CCPA, and other data protection regulations.
          </p>
        </div>
      </div>
    </div>
  );
}
