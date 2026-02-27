import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description:
    'Cookie Policy for PodBrain. Learn about the cookies and tracking technologies we use.',
}

export default function CookiePolicyPage() {
  return (
    <article>
      <h1 className="font-display text-3xl font-bold tracking-tight text-foreground mb-2">
        Cookie Policy
      </h1>
      <p className="text-sm text-muted-foreground mb-10">
        Last updated: February 26, 2026
      </p>

      <div className="space-y-8 text-muted-foreground leading-relaxed">
        {/* Intro */}
        <section>
          <p>
            This Cookie Policy explains how PodBrain (&quot;we&quot;,
            &quot;us&quot;, or &quot;our&quot;) uses cookies and similar
            tracking technologies when you visit or use our platform at
            getpodbrain.ai. This policy should be read alongside our{' '}
            <a
              href="/privacy"
              className="text-accent underline underline-offset-2 hover:text-accent/80 transition-colors"
            >
              Privacy Policy
            </a>
            .
          </p>
        </section>

        {/* 1 */}
        <section>
          <h2 className="font-display text-xl font-semibold text-foreground mb-3">
            1. What Are Cookies?
          </h2>
          <p>
            Cookies are small text files that are stored on your device (computer,
            tablet, or mobile) when you visit a website. They are widely used to
            make websites work more efficiently, remember your preferences, and
            provide information to the site owner. Cookies can be
            &quot;persistent&quot; (remaining on your device until they expire or
            are deleted) or &quot;session&quot; cookies (deleted when you close
            your browser).
          </p>
        </section>

        {/* 2 */}
        <section>
          <h2 className="font-display text-xl font-semibold text-foreground mb-3">
            2. Cookies We Use
          </h2>

          <h3 className="font-display text-base font-medium text-foreground mt-4 mb-2">
            2.1 Essential Cookies
          </h3>
          <p>
            These cookies are strictly necessary for the Service to function.
            They cannot be disabled without impairing the core functionality of
            the platform.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm border border-border rounded-lg">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-2 px-3 font-medium text-foreground">
                    Cookie
                  </th>
                  <th className="text-left py-2 px-3 font-medium text-foreground">
                    Purpose
                  </th>
                  <th className="text-left py-2 px-3 font-medium text-foreground">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="py-2 px-3 font-mono text-xs">
                    sb-*-auth-token
                  </td>
                  <td className="py-2 px-3">
                    Supabase authentication session. Keeps you logged in across
                    page visits.
                  </td>
                  <td className="py-2 px-3">Session / 1 year</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 px-3 font-mono text-xs">
                    sb-*-auth-token-code-verifier
                  </td>
                  <td className="py-2 px-3">
                    PKCE code verifier for secure authentication flow.
                  </td>
                  <td className="py-2 px-3">Session</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="font-display text-base font-medium text-foreground mt-6 mb-2">
            2.2 Functional Cookies
          </h3>
          <p>
            These cookies enable enhanced functionality and personalization.
            They may be set by us or by third-party providers whose services we
            use on our pages.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm border border-border rounded-lg">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-2 px-3 font-medium text-foreground">
                    Cookie
                  </th>
                  <th className="text-left py-2 px-3 font-medium text-foreground">
                    Purpose
                  </th>
                  <th className="text-left py-2 px-3 font-medium text-foreground">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="py-2 px-3 font-mono text-xs">
                    podbrain-theme
                  </td>
                  <td className="py-2 px-3">
                    Stores your preferred color theme (light or dark mode) to
                    prevent flash of unstyled content on page load.
                  </td>
                  <td className="py-2 px-3">Persistent (localStorage)</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 px-3 font-mono text-xs">
                    podbrain-sidebar
                  </td>
                  <td className="py-2 px-3">
                    Remembers your sidebar collapsed or expanded preference.
                  </td>
                  <td className="py-2 px-3">Persistent (localStorage)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm">
            Note: &quot;podbrain-theme&quot; and &quot;podbrain-sidebar&quot; use
            browser localStorage rather than HTTP cookies. They are included here
            for transparency as they serve a similar function.
          </p>

          <h3 className="font-display text-base font-medium text-foreground mt-6 mb-2">
            2.3 Third-Party Cookies
          </h3>
          <p>
            Some third-party services we use may set their own cookies on your
            device:
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm border border-border rounded-lg">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-2 px-3 font-medium text-foreground">
                    Provider
                  </th>
                  <th className="text-left py-2 px-3 font-medium text-foreground">
                    Purpose
                  </th>
                  <th className="text-left py-2 px-3 font-medium text-foreground">
                    More Info
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="py-2 px-3 font-medium text-foreground">
                    Stripe
                  </td>
                  <td className="py-2 px-3">
                    Fraud prevention and payment processing. Stripe sets cookies
                    to detect fraudulent activity and secure payment
                    transactions.
                  </td>
                  <td className="py-2 px-3">
                    <a
                      href="https://stripe.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent underline underline-offset-2 hover:text-accent/80 transition-colors"
                    >
                      Stripe Privacy Policy
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 3 */}
        <section>
          <h2 className="font-display text-xl font-semibold text-foreground mb-3">
            3. How to Manage Cookies
          </h2>
          <p>
            Most web browsers allow you to control cookies through their settings.
            You can typically find these settings in the &quot;Options&quot;,
            &quot;Preferences&quot;, or &quot;Settings&quot; menu of your browser.
            The following links may be helpful:
          </p>
          <ul className="list-disc list-inside mt-3 space-y-1.5">
            <li>
              <a
                href="https://support.google.com/chrome/answer/95647"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline underline-offset-2 hover:text-accent/80 transition-colors"
              >
                Google Chrome
              </a>
            </li>
            <li>
              <a
                href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline underline-offset-2 hover:text-accent/80 transition-colors"
              >
                Mozilla Firefox
              </a>
            </li>
            <li>
              <a
                href="https://support.apple.com/guide/safari/manage-cookies-sfri11471"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline underline-offset-2 hover:text-accent/80 transition-colors"
              >
                Apple Safari
              </a>
            </li>
            <li>
              <a
                href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline underline-offset-2 hover:text-accent/80 transition-colors"
              >
                Microsoft Edge
              </a>
            </li>
          </ul>
          <p className="mt-3">
            Please note that disabling essential cookies may prevent you from
            using certain features of the Service, such as staying logged in.
          </p>
        </section>

        {/* 4 */}
        <section>
          <h2 className="font-display text-xl font-semibold text-foreground mb-3">
            4. Do Not Track
          </h2>
          <p>
            Some browsers offer a &quot;Do Not Track&quot; (DNT) setting that
            sends a signal to websites you visit indicating that you do not want
            to be tracked. PodBrain does not currently use analytics tracking
            cookies, so there is no tracking behavior to modify in response to a
            DNT signal. If we add analytics in the future, we will update this
            policy and honor DNT signals where technically feasible.
          </p>
        </section>

        {/* 5 */}
        <section>
          <h2 className="font-display text-xl font-semibold text-foreground mb-3">
            5. Changes to This Policy
          </h2>
          <p>
            We may update this Cookie Policy from time to time. Any changes will
            be posted on this page with a revised &quot;Last updated&quot; date.
            If we make significant changes to how we use cookies, we will notify
            you through the Service or by email. We encourage you to review this
            policy periodically to stay informed about our use of cookies.
          </p>
        </section>

        {/* 6 */}
        <section>
          <h2 className="font-display text-xl font-semibold text-foreground mb-3">
            6. Contact
          </h2>
          <p>
            If you have questions about our use of cookies, please contact us at:
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
        </section>
      </div>
    </article>
  )
}
