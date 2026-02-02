import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>Last updated: February 2, 2026</p>
      </div>

      {/* Content */}
      <div className="prose prose-lg max-w-none space-y-8">
        {/* Introduction */}
        <section>
          <p style={{ color: "var(--text-primary)", lineHeight: "1.8" }}>
            These Terms of Service ("Terms") govern your access to and use of PodBrain Inc.'s
            ("we", "us", or "our") website, services, and applications (collectively, the
            "Service"). By accessing or using the Service, you agree to be bound by these Terms. If
            you disagree with any part of the Terms, you may not access the Service.
          </p>
        </section>

        {/* Acceptance of Terms */}
        <section>
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
          >
            Acceptance of Terms
          </h2>
          <p style={{ color: "var(--text-primary)", lineHeight: "1.8" }}>
            By creating an account or using any part of the Service, you acknowledge that you have
            read, understood, and agree to be bound by these Terms and our Privacy Policy. If you
            are using the Service on behalf of an organization, you represent that you have the
            authority to bind that organization to these Terms.
          </p>
        </section>

        {/* Service Description */}
        <section>
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
          >
            Description of Service
          </h2>
          <p style={{ color: "var(--text-primary)", lineHeight: "1.8" }}>
            PodBrain provides an AI-powered platform for podcast creators that transforms audio
            files into transcripts, show notes, SEO-optimized content, and promotional assets. Our
            Service uses artificial intelligence to process your content, including transcription,
            content generation, and vocabulary learning specific to your podcast.
          </p>
        </section>

        {/* User Accounts */}
        <section>
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
          >
            User Accounts
          </h2>
          <p style={{ color: "var(--text-primary)", lineHeight: "1.8", marginBottom: "1rem" }}>
            When you create an account with us, you must provide accurate, complete, and current
            information. You are responsible for:
          </p>
          <ul
            className="list-disc pl-6 space-y-2"
            style={{ color: "var(--text-primary)", lineHeight: "1.8" }}
          >
            <li>Safeguarding your account credentials and maintaining account security</li>
            <li>All activities that occur under your account</li>
            <li>Notifying us immediately of any unauthorized use of your account</li>
            <li>Ensuring your account information remains accurate and up-to-date</li>
          </ul>
          <p
            style={{
              color: "var(--text-primary)",
              lineHeight: "1.8",
              marginTop: "1rem",
            }}
          >
            We reserve the right to suspend or terminate accounts that violate these Terms or engage
            in fraudulent, abusive, or illegal activity.
          </p>
        </section>

        {/* Content Ownership */}
        <section>
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
          >
            Content Ownership and License
          </h2>
          <p style={{ color: "var(--text-primary)", lineHeight: "1.8", marginBottom: "1rem" }}>
            <strong>Your Content:</strong> You retain all ownership rights to the content you upload
            to the Service, including audio files, podcast metadata, and custom vocabulary. By
            uploading content, you grant us a limited, worldwide, non-exclusive license to:
          </p>
          <ul
            className="list-disc pl-6 space-y-2"
            style={{ color: "var(--text-primary)", lineHeight: "1.8" }}
          >
            <li>Process, store, and analyze your content to provide the Service</li>
            <li>Generate transcripts, show notes, and derivative content assets</li>
            <li>
              Use your content to train AI models specifically for your shows (vocabulary learning)
            </li>
            <li>Create backups and ensure service reliability</li>
          </ul>
          <p
            style={{
              color: "var(--text-primary)",
              lineHeight: "1.8",
              marginTop: "1rem",
            }}
          >
            <strong>Generated Content:</strong> You own all AI-generated content produced by the
            Service from your input, including transcripts, show notes, and promotional assets. You
            may use, modify, and distribute this content without restriction.
          </p>
          <p
            style={{
              color: "var(--text-primary)",
              lineHeight: "1.8",
              marginTop: "1rem",
            }}
          >
            <strong>Our Property:</strong> The Service, including its design, features, software,
            and underlying technology, is owned by PodBrain Inc. and protected by intellectual
            property laws.
          </p>
        </section>

        {/* Acceptable Use */}
        <section>
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
          >
            Acceptable Use Policy
          </h2>
          <p style={{ color: "var(--text-primary)", lineHeight: "1.8", marginBottom: "1rem" }}>
            You agree not to use the Service to:
          </p>
          <ul
            className="list-disc pl-6 space-y-2"
            style={{ color: "var(--text-primary)", lineHeight: "1.8" }}
          >
            <li>
              Upload content that violates copyright, trademark, or other intellectual property
              rights
            </li>
            <li>
              Share illegal, harmful, threatening, abusive, harassing, defamatory, or offensive
              content
            </li>
            <li>Distribute malware, viruses, or other malicious code</li>
            <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
            <li>Interfere with or disrupt the Service or servers</li>
            <li>Use automated systems to scrape or data mine the Service</li>
            <li>Resell or redistribute the Service without authorization</li>
            <li>Impersonate others or provide false information</li>
            <li>Violate any applicable laws or regulations</li>
          </ul>
        </section>

        {/* Service Limitations */}
        <section>
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
          >
            Service Limitations
          </h2>
          <p style={{ color: "var(--text-primary)", lineHeight: "1.8", marginBottom: "1rem" }}>
            The Service is subject to the following limitations:
          </p>
          <ul
            className="list-disc pl-6 space-y-2"
            style={{ color: "var(--text-primary)", lineHeight: "1.8" }}
          >
            <li>Maximum audio file size: 500MB per file</li>
            <li>Maximum audio duration: 4 hours per episode</li>
            <li>Episode processing limits based on your subscription tier</li>
            <li>Storage limits for audio files and generated content</li>
            <li>API rate limits to ensure service stability</li>
          </ul>
          <p
            style={{
              color: "var(--text-primary)",
              lineHeight: "1.8",
              marginTop: "1rem",
            }}
          >
            We may modify these limitations at any time. Excessive use that impacts service
            performance may result in temporary throttling or account suspension.
          </p>
        </section>

        {/* Payment Terms */}
        <section>
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
          >
            Payment Terms
          </h2>
          <p style={{ color: "var(--text-primary)", lineHeight: "1.8" }}>
            <strong>Subscription Plans:</strong> We offer Free, Pro, and Agency subscription tiers.
            Paid subscriptions are billed monthly or annually in advance. All payments are processed
            securely through Stripe.
          </p>
          <p
            style={{
              color: "var(--text-primary)",
              lineHeight: "1.8",
              marginTop: "1rem",
            }}
          >
            <strong>Billing:</strong> By subscribing to a paid plan, you authorize us to charge your
            payment method on a recurring basis. Subscription fees are non-refundable except as
            required by law. We reserve the right to change pricing with 30 days' notice.
          </p>
          <p
            style={{
              color: "var(--text-primary)",
              lineHeight: "1.8",
              marginTop: "1rem",
            }}
          >
            <strong>Cancellation:</strong> You may cancel your subscription at any time. Upon
            cancellation, you will retain access until the end of your current billing period. No
            refunds will be provided for partial months.
          </p>
          <p
            style={{
              color: "var(--text-primary)",
              lineHeight: "1.8",
              marginTop: "1rem",
            }}
          >
            <strong>Free Trial:</strong> We may offer free trial periods for paid plans. You will be
            charged when the trial ends unless you cancel before the trial expiration date.
          </p>
        </section>

        {/* Termination */}
        <section>
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
          >
            Termination
          </h2>
          <p style={{ color: "var(--text-primary)", lineHeight: "1.8" }}>
            We may terminate or suspend your account and access to the Service immediately, without
            prior notice or liability, for any reason, including but not limited to breach of these
            Terms. Upon termination, your right to use the Service will cease immediately. All
            provisions of these Terms which by their nature should survive termination shall survive,
            including ownership provisions, warranty disclaimers, and limitations of liability.
          </p>
        </section>

        {/* Disclaimer of Warranties */}
        <section>
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
          >
            Disclaimer of Warranties
          </h2>
          <p style={{ color: "var(--text-primary)", lineHeight: "1.8" }}>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
            WHETHER EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES, INCLUDING IMPLIED WARRANTIES OF
            MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT
            WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE, OR THAT DEFECTS
            WILL BE CORRECTED. AI-GENERATED CONTENT MAY CONTAIN ERRORS OR INACCURACIES. YOU ARE
            RESPONSIBLE FOR REVIEWING AND VERIFYING ALL GENERATED CONTENT BEFORE USE.
          </p>
        </section>

        {/* Limitation of Liability */}
        <section>
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
          >
            Limitation of Liability
          </h2>
          <p style={{ color: "var(--text-primary)", lineHeight: "1.8" }}>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, PODBRAIN INC. SHALL NOT BE LIABLE FOR ANY
            INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF
            PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE,
            GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM: (A) YOUR ACCESS TO OR USE OF OR
            INABILITY TO ACCESS OR USE THE SERVICE; (B) ANY CONDUCT OR CONTENT OF ANY THIRD PARTY;
            (C) UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR CONTENT; OR (D) ANY OTHER MATTER
            RELATING TO THE SERVICE. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN
            THE TWELVE MONTHS PRIOR TO THE EVENT GIVING RISE TO LIABILITY, OR ONE HUNDRED DOLLARS
            ($100), WHICHEVER IS GREATER.
          </p>
        </section>

        {/* Indemnification */}
        <section>
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
          >
            Indemnification
          </h2>
          <p style={{ color: "var(--text-primary)", lineHeight: "1.8" }}>
            You agree to indemnify, defend, and hold harmless PodBrain Inc., its officers,
            directors, employees, and agents from any claims, liabilities, damages, losses, and
            expenses, including reasonable attorneys' fees, arising out of or in any way connected
            with your access to or use of the Service, your violation of these Terms, or your
            infringement of any intellectual property or other rights of any person or entity.
          </p>
        </section>

        {/* Governing Law */}
        <section>
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
          >
            Governing Law and Dispute Resolution
          </h2>
          <p style={{ color: "var(--text-primary)", lineHeight: "1.8" }}>
            These Terms shall be governed by and construed in accordance with the laws of the State
            of Delaware, United States, without regard to its conflict of law provisions. Any
            dispute arising from these Terms or the Service shall be resolved through binding
            arbitration in accordance with the rules of the American Arbitration Association, except
            that either party may seek injunctive relief in court for intellectual property
            infringement.
          </p>
        </section>

        {/* Changes to Terms */}
        <section>
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
          >
            Changes to These Terms
          </h2>
          <p style={{ color: "var(--text-primary)", lineHeight: "1.8" }}>
            We reserve the right to modify these Terms at any time. We will notify you of material
            changes by posting the updated Terms on this page and updating the "Last updated" date.
            Your continued use of the Service after changes become effective constitutes acceptance
            of the revised Terms. If you disagree with the changes, you must stop using the Service
            and cancel your account.
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
            If you have any questions about these Terms, please contact us:
          </p>
          <ul
            className="list-none pl-0 space-y-2 mt-4"
            style={{ color: "var(--text-primary)", lineHeight: "1.8" }}
          >
            <li>Email: legal@getpodbrain.ai</li>
            <li>Website: getpodbrain.ai</li>
          </ul>
        </section>

        {/* Notice */}
        <div
          className="alert-card info mt-12"
          style={{ backgroundColor: "rgba(0, 122, 255, 0.05)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-primary)", margin: 0 }}>
            <strong>Note:</strong> This is placeholder legal content. Before launch, these Terms of
            Service must be reviewed by qualified legal counsel to ensure compliance with applicable
            laws and proper protection of both user and company interests.
          </p>
        </div>
      </div>
    </div>
  );
}
