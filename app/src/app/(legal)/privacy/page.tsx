import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Privacy Policy for PodBrain. Learn how we collect, use, and protect your data.',
}

export default function PrivacyPolicyPage() {
  return (
    <article>
      <h1 className="font-display text-3xl font-bold tracking-tight text-foreground mb-2">
        Privacy Policy
      </h1>
      <p className="text-sm text-muted-foreground mb-10">
        Last updated: February 26, 2026
      </p>

      <div className="space-y-8 text-muted-foreground leading-relaxed">
        {/* Intro */}
        <section>
          <p>
            PodBrain (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;)
            operates the website and platform at getpodbrain.ai. This Privacy
            Policy explains how we collect, use, disclose, and safeguard your
            information when you use our Service. We are committed to protecting
            your privacy and handling your data in an open, transparent manner.
          </p>
          <p className="mt-3">
            If you are located in the European Economic Area (EEA), United
            Kingdom, or any jurisdiction with data protection legislation, please
            review the &quot;Your Rights&quot; section carefully for information
            on how to exercise your data subject rights.
          </p>
        </section>

        {/* 1 */}
        <section>
          <h2 className="font-display text-xl font-semibold text-foreground mb-3">
            1. Information We Collect
          </h2>

          <h3 className="font-display text-base font-medium text-foreground mt-4 mb-2">
            1.1 Information You Provide
          </h3>
          <ul className="list-disc list-inside space-y-1.5">
            <li>
              <strong className="text-foreground">Account Information:</strong>{' '}
              When you create an account, we collect your name, email address,
              and password.
            </li>
            <li>
              <strong className="text-foreground">Podcast Content:</strong>{' '}
              Audio files, episode metadata (titles, descriptions, guest
              information), custom vocabulary terms, and any other content you
              upload to the Service.
            </li>
            <li>
              <strong className="text-foreground">Payment Information:</strong>{' '}
              When you subscribe to a paid plan, payment details are collected
              and processed by Stripe. We do not store your full credit card
              number on our servers.
            </li>
            <li>
              <strong className="text-foreground">Communications:</strong>{' '}
              Information you provide when contacting us for support or feedback.
            </li>
          </ul>

          <h3 className="font-display text-base font-medium text-foreground mt-4 mb-2">
            1.2 Information Collected Automatically
          </h3>
          <ul className="list-disc list-inside space-y-1.5">
            <li>
              <strong className="text-foreground">Usage Data:</strong> Pages
              visited, features used, time spent on the Service, and interaction
              patterns.
            </li>
            <li>
              <strong className="text-foreground">Device Information:</strong>{' '}
              Browser type, operating system, device identifiers, and screen
              resolution.
            </li>
            <li>
              <strong className="text-foreground">Log Data:</strong> IP address,
              access times, referring URLs, and server log information.
            </li>
          </ul>
        </section>

        {/* 2 */}
        <section>
          <h2 className="font-display text-xl font-semibold text-foreground mb-3">
            2. How We Use Your Information
          </h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc list-inside mt-3 space-y-1.5">
            <li>Provide, operate, and maintain the Service.</li>
            <li>
              Process your audio files through transcription and AI content
              generation to deliver show notes, content assets, and SEO
              analysis.
            </li>
            <li>
              Improve the accuracy of transcriptions through your custom
              vocabulary terms and correction data.
            </li>
            <li>Process payments and manage your subscription.</li>
            <li>
              Send you service-related communications, including account
              notifications, processing updates, and security alerts.
            </li>
            <li>
              Analyze usage patterns to improve and optimize the Service.
            </li>
            <li>
              Detect, prevent, and address technical issues, fraud, or security
              threats.
            </li>
            <li>Comply with legal obligations.</li>
          </ul>
        </section>

        {/* 3 */}
        <section>
          <h2 className="font-display text-xl font-semibold text-foreground mb-3">
            3. AI Data Processing
          </h2>
          <p>
            A core function of PodBrain is the AI-powered processing of your
            podcast content. Here is how that processing works:
          </p>

          <h3 className="font-display text-base font-medium text-foreground mt-4 mb-2">
            3.1 Audio Transcription
          </h3>
          <p>
            Your audio files are sent to AssemblyAI, a third-party transcription
            provider, for speech-to-text conversion with speaker diarization.
            AssemblyAI processes your audio in accordance with their privacy
            policy and data processing agreement. Audio data sent to AssemblyAI
            is used solely for transcription and is not retained by them beyond
            the processing period.
          </p>

          <h3 className="font-display text-base font-medium text-foreground mt-4 mb-2">
            3.2 Content Generation
          </h3>
          <p>
            Transcripts and metadata are sent to xAI (Grok) to generate show
            notes, content assets, SEO analysis, and other derived content. The
            AI provider processes this data according to their respective privacy
            policies. We send only the minimum data necessary for content
            generation.
          </p>

          <h3 className="font-display text-base font-medium text-foreground mt-4 mb-2">
            3.3 Custom Vocabulary
          </h3>
          <p>
            Your custom vocabulary terms are stored in our database and used to
            improve transcription accuracy for your content. Vocabulary data is
            associated with your account and is not shared with other users or
            used to train third-party AI models.
          </p>
        </section>

        {/* 4 */}
        <section>
          <h2 className="font-display text-xl font-semibold text-foreground mb-3">
            4. Data Storage and Security
          </h2>
          <p>
            Your data is stored using Supabase, a cloud-hosted PostgreSQL
            database service with infrastructure on Amazon Web Services (AWS).
            Audio files are stored in Supabase Storage with encrypted-at-rest
            storage. All data in transit is encrypted using TLS 1.2 or higher.
          </p>
          <p className="mt-3">
            We implement commercially reasonable technical and organizational
            measures to protect your data, including encryption at rest and in
            transit, access controls, regular security assessments, and secure
            development practices. However, no method of electronic storage or
            transmission is completely secure, and we cannot guarantee absolute
            security.
          </p>
        </section>

        {/* 5 */}
        <section>
          <h2 className="font-display text-xl font-semibold text-foreground mb-3">
            5. Third-Party Services
          </h2>
          <p>
            We use the following third-party services to operate PodBrain. Each
            service has its own privacy policy governing how it handles data:
          </p>
          <ul className="list-disc list-inside mt-3 space-y-1.5">
            <li>
              <strong className="text-foreground">Supabase:</strong> Database
              hosting, authentication, and file storage.
            </li>
            <li>
              <strong className="text-foreground">AssemblyAI:</strong> Audio
              transcription and speaker diarization.
            </li>
            <li>
              <strong className="text-foreground">xAI (Grok):</strong> AI
              content generation including show notes, summaries, and SEO
              analysis.
            </li>
            <li>
              <strong className="text-foreground">Stripe:</strong> Payment
              processing and subscription management.
            </li>
            <li>
              <strong className="text-foreground">Resend:</strong> Transactional
              email delivery.
            </li>
            <li>
              <strong className="text-foreground">Upstash:</strong> Redis
              caching for performance optimization.
            </li>
            <li>
              <strong className="text-foreground">Vercel:</strong> Application
              hosting and deployment.
            </li>
          </ul>
          <p className="mt-3">
            We do not sell your personal data to any third party. Data shared
            with third-party services is limited to what is necessary for them
            to perform their specific function.
          </p>
        </section>

        {/* 6 */}
        <section>
          <h2 className="font-display text-xl font-semibold text-foreground mb-3">
            6. Your Rights
          </h2>
          <p>
            Depending on your location, you may have the following rights
            regarding your personal data:
          </p>
          <ul className="list-disc list-inside mt-3 space-y-1.5">
            <li>
              <strong className="text-foreground">Right of Access:</strong>{' '}
              Request a copy of the personal data we hold about you.
            </li>
            <li>
              <strong className="text-foreground">Right to Rectification:</strong>{' '}
              Request correction of inaccurate or incomplete data.
            </li>
            <li>
              <strong className="text-foreground">Right to Erasure:</strong>{' '}
              Request deletion of your personal data, subject to legal
              retention requirements.
            </li>
            <li>
              <strong className="text-foreground">Right to Restrict Processing:</strong>{' '}
              Request that we limit the processing of your data in certain
              circumstances.
            </li>
            <li>
              <strong className="text-foreground">Right to Data Portability:</strong>{' '}
              Request a machine-readable copy of your data to transfer to
              another service.
            </li>
            <li>
              <strong className="text-foreground">Right to Object:</strong>{' '}
              Object to processing of your data for certain purposes, including
              direct marketing.
            </li>
            <li>
              <strong className="text-foreground">Right to Withdraw Consent:</strong>{' '}
              Where processing is based on consent, you may withdraw that
              consent at any time.
            </li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights, please contact us at{' '}
            <a
              href="mailto:privacy@getpodbrain.ai"
              className="text-accent underline underline-offset-2 hover:text-accent/80 transition-colors"
            >
              privacy@getpodbrain.ai
            </a>
            . We will respond to your request within 30 days. If you are in the
            EEA and believe we have not adequately addressed your concerns, you
            have the right to lodge a complaint with your local data protection
            authority.
          </p>
        </section>

        {/* 7 */}
        <section>
          <h2 className="font-display text-xl font-semibold text-foreground mb-3">
            7. Data Retention
          </h2>
          <p>
            We retain your personal data for as long as your account is active
            or as needed to provide the Service. Specifically:
          </p>
          <ul className="list-disc list-inside mt-3 space-y-1.5">
            <li>
              <strong className="text-foreground">Account data:</strong> Retained
              while your account is active and for 30 days after deletion to
              allow for account recovery.
            </li>
            <li>
              <strong className="text-foreground">Audio files:</strong> Retained
              until you delete them or close your account.
            </li>
            <li>
              <strong className="text-foreground">Generated content:</strong>{' '}
              Retained until you delete the associated episode or close your
              account.
            </li>
            <li>
              <strong className="text-foreground">Payment records:</strong>{' '}
              Retained for the period required by tax and financial regulations
              (typically 7 years).
            </li>
            <li>
              <strong className="text-foreground">Usage logs:</strong> Retained
              for up to 90 days for debugging and security purposes, then
              anonymized or deleted.
            </li>
          </ul>
        </section>

        {/* 8 */}
        <section>
          <h2 className="font-display text-xl font-semibold text-foreground mb-3">
            8. Cookies and Tracking
          </h2>
          <p>
            We use cookies and similar technologies to operate the Service. For
            detailed information about the types of cookies we use and how to
            manage them, please refer to our{' '}
            <a
              href="/cookies"
              className="text-accent underline underline-offset-2 hover:text-accent/80 transition-colors"
            >
              Cookie Policy
            </a>
            .
          </p>
        </section>

        {/* 9 */}
        <section>
          <h2 className="font-display text-xl font-semibold text-foreground mb-3">
            9. International Data Transfers
          </h2>
          <p>
            Your data may be transferred to and processed in countries outside
            your country of residence, including the United States. These
            countries may have data protection laws that differ from those in
            your jurisdiction. When we transfer data internationally, we
            implement appropriate safeguards, including standard contractual
            clauses approved by relevant data protection authorities, to ensure
            your data receives an adequate level of protection.
          </p>
        </section>

        {/* 10 */}
        <section>
          <h2 className="font-display text-xl font-semibold text-foreground mb-3">
            10. Children&apos;s Privacy
          </h2>
          <p>
            The Service is not intended for individuals under the age of 16. We
            do not knowingly collect personal data from children under 16. If
            you become aware that a child has provided us with personal data,
            please contact us and we will take steps to delete such information.
          </p>
        </section>

        {/* 11 */}
        <section>
          <h2 className="font-display text-xl font-semibold text-foreground mb-3">
            11. Changes to This Policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time to reflect
            changes in our practices, technology, legal requirements, or other
            factors. We will post the updated policy on this page with a revised
            &quot;Last updated&quot; date. If we make material changes, we will
            notify you by email or through a prominent notice within the Service
            prior to the change taking effect. We encourage you to review this
            policy periodically.
          </p>
        </section>

        {/* 12 */}
        <section>
          <h2 className="font-display text-xl font-semibold text-foreground mb-3">
            12. Contact
          </h2>
          <p>
            If you have questions or concerns about this Privacy Policy or our
            data practices, please contact us at:
          </p>
          <p className="mt-3">
            <strong className="text-foreground">Email:</strong>{' '}
            <a
              href="mailto:privacy@getpodbrain.ai"
              className="text-accent underline underline-offset-2 hover:text-accent/80 transition-colors"
            >
              privacy@getpodbrain.ai
            </a>
          </p>
          <p className="mt-1">
            <strong className="text-foreground">Data Controller:</strong>{' '}
            PodBrain, operated at getpodbrain.ai
          </p>
        </section>
      </div>
    </article>
  )
}
