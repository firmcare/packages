import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'FirmCare Diagnostics Privacy Policy — how we collect, use, and protect your personal data in compliance with the Nigeria Data Protection Act 2023.',
  alternates: { canonical: '/privacy' },
  robots: { index: true, follow: true },
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://firmcare.com.ng';
const EFFECTIVE_DATE = '1 April 2025';
const CONTACT_EMAIL  = 'info@firmcare.com.ng';
const CONTACT_PHONE  = '+234-808-874-3272';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">{title}</h2>
      <div className="space-y-4 text-gray-600 text-sm leading-relaxed">{children}</div>
    </section>
  );
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
      {children}
    </div>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <main className="bg-white min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-b border-purple-100">
        <div className="max-w-3xl mx-auto px-6 py-14 sm:py-20">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-500 text-sm">
            Effective date: <strong>{EFFECTIVE_DATE}</strong> &nbsp;·&nbsp; Last updated: <strong>{EFFECTIVE_DATE}</strong>
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-6 py-12 sm:py-16">

        <p className="text-sm text-gray-600 leading-relaxed mb-10">
          FirmCare Diagnostics &amp; Medical Services Ltd (&ldquo;FirmCare&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or
          &ldquo;us&rdquo;) is committed to protecting the privacy of every person who uses our website and services.
          This Privacy Policy explains what personal data we collect, why we collect it, how we use it, and the
          rights you have under the <strong>Nigeria Data Protection Act 2023 (NDPA)</strong> and other applicable laws.
          By accessing or using our website at{' '}
          <a href={siteUrl} className="text-primary underline">{siteUrl}</a> or booking any of our diagnostic
          services, you acknowledge that you have read and understood this Policy.
        </p>

        <Section title="1. Who We Are">
          <p>
            <strong>Data Controller:</strong> FirmCare Diagnostics &amp; Medical Services Ltd<br />
            <strong>Address:</strong> No 3, Bouar Close, by Jevenik Restaurant, Beside St. Francois Hospital,
            off Bangui Street, off Adetokunbo Crescent, Wuse 2, Abuja, FCT, Nigeria<br />
            <strong>Email:</strong> <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">{CONTACT_EMAIL}</a><br />
            <strong>Phone:</strong> {CONTACT_PHONE}
          </p>
          <p>
            If you have any questions about this Policy or how we handle your data, please contact us using
            the details above.
          </p>
        </Section>

        <Section title="2. Data We Collect">
          <Sub title="2.1 Information you provide directly">
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account registration:</strong> full name, email address, phone number, password</li>
              <li><strong>Booking:</strong> preferred date, home-collection address (if applicable), health package selection</li>
              <li><strong>Payment:</strong> transaction reference (processed by Paystack — we never store card details)</li>
              <li><strong>Contact form:</strong> name, email, phone number, and message content</li>
              <li><strong>Agent / referral programme:</strong> bank account details for reward withdrawals</li>
            </ul>
          </Sub>
          <Sub title="2.2 Information collected automatically">
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Usage data:</strong> pages visited, clicks, time on page, search queries (only if you have accepted analytics cookies)</li>
              <li><strong>Device &amp; browser data:</strong> device type, browser name and version, operating system (anonymised)</li>
              <li><strong>Approximate location:</strong> country and city inferred from your IP address — your IP address itself is <em>not</em> stored</li>
              <li><strong>Referrer &amp; UTM data:</strong> which website or campaign directed you to us</li>
              <li><strong>Session identifiers:</strong> random IDs stored in your browser to link page views within a session (these are not linked to your identity unless you are logged in)</li>
            </ul>
          </Sub>
          <Sub title="2.3 Sensitive health data">
            <p>
              The tests you book may imply health conditions. We treat booking data as <strong>sensitive personal data</strong> and
              apply the highest level of protection to it. We do not sell or share your health-related
              booking information with any advertiser or data broker.
            </p>
          </Sub>
        </Section>

        <Section title="3. How We Use Your Data">
          <table className="w-full text-xs border border-gray-200 rounded-xl overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 font-semibold text-gray-700">Purpose</th>
                <th className="text-left p-3 font-semibold text-gray-700">Lawful Basis (NDPA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ["Create and manage your account", "Contract / Legitimate interest"],
                ["Process and confirm bookings", "Contract"],
                ["Send booking confirmation and reminder emails", "Contract / Legitimate interest"],
                ["Process payments via Paystack", "Contract"],
                ["Deliver test results securely", "Contract"],
                ["Operate the referral and agent programme", "Contract"],
                ["Respond to contact-form enquiries", "Legitimate interest"],
                ["Send marketing emails (only with your consent)", "Consent"],
                ["Analyse website usage to improve our service", "Consent (analytics cookies)"],
                ["Comply with legal and regulatory obligations", "Legal obligation"],
                ["Detect and prevent fraud or abuse", "Legitimate interest"],
              ].map(([purpose, basis]) => (
                <tr key={purpose}>
                  <td className="p-3 text-gray-600">{purpose}</td>
                  <td className="p-3 text-gray-500">{basis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="4. Cookies and Similar Technologies">
          <p>
            We use the following categories of cookies on our website:
          </p>
          <Sub title="Essential cookies">
            <p>
              Required for authentication (login sessions), shopping cart functionality, and booking
              flow. These cannot be disabled as they are strictly necessary for the service to function.
            </p>
          </Sub>
          <Sub title="Analytics cookies (requires your consent)">
            <p>
              We run a <strong>self-hosted analytics system</strong> stored on our own servers in Nigeria.
              Your data never leaves our infrastructure. We collect: pages visited, approximate
              location (country/city from IP — IP not stored), device type, browser, and campaign source.
              No third-party analytics services (e.g. Google Analytics) are used.
            </p>
          </Sub>
          <p>
            You can change your cookie preferences at any time by clicking <em>&ldquo;Cookie Preferences&rdquo;</em> in
            the consent banner or by clearing your browser&apos;s localStorage (key: <code className="bg-gray-100 px-1 rounded text-xs">fc_consent</code>).
          </p>
        </Section>

        <Section title="5. Data Sharing and Third Parties">
          <p>We share personal data <strong>only</strong> in the following limited circumstances:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Paystack</strong> — payment processing. Paystack receives your payment details directly.
              Their privacy policy applies to data they collect:{' '}
              <a href="https://paystack.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline">paystack.com/privacy</a>.
            </li>
            <li>
              <strong>Laboratory partners</strong> — to fulfil your diagnostic tests. Only the minimum necessary
              data (name, test type, sample reference) is shared. Partners are contractually bound to
              confidentiality.
            </li>
            <li>
              <strong>Cloudinary</strong> — image hosting for profile and blog images. No personal health data
              is stored with Cloudinary.
            </li>
            <li>
              <strong>SMTP email provider</strong> — transactional emails (booking confirmations, results). Your
              name and email are transmitted to deliver the email.
            </li>
            <li>
              <strong>Legal authorities</strong> — if required by a court order, law enforcement request, or
              other legal obligation under Nigerian law.
            </li>
          </ul>
          <p>We do <strong>not</strong> sell, rent, or trade your personal data to any third party.</p>
        </Section>

        <Section title="6. Data Retention">
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Account data</strong> — retained for the lifetime of your account, plus 2 years after account closure for legal compliance.</li>
            <li><strong>Booking and test result records</strong> — retained for 7 years to comply with Nigerian medical records regulations.</li>
            <li><strong>Payment transaction records</strong> — retained for 7 years to comply with the Companies and Allied Matters Act (CAMA).</li>
            <li><strong>Analytics events</strong> — retained for 24 months, then automatically deleted.</li>
            <li><strong>Contact form messages</strong> — retained for 12 months.</li>
            <li><strong>Marketing consent records</strong> — retained until consent is withdrawn, plus 1 year.</li>
          </ul>
        </Section>

        <Section title="7. Your Rights Under the NDPA 2023">
          <p>As a data subject under Nigerian law, you have the right to:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Access</strong> — request a copy of the personal data we hold about you.</li>
            <li><strong>Rectification</strong> — request correction of inaccurate or incomplete data.</li>
            <li><strong>Erasure</strong> — request deletion of your data (subject to legal retention obligations).</li>
            <li><strong>Restriction</strong> — request that we limit processing of your data in certain circumstances.</li>
            <li><strong>Data portability</strong> — receive your data in a structured, machine-readable format.</li>
            <li><strong>Object</strong> — object to processing based on legitimate interest or for direct marketing.</li>
            <li><strong>Withdraw consent</strong> — withdraw consent for marketing emails or analytics cookies at any time without penalty.</li>
          </ul>
          <p>
            To exercise any of these rights, please email us at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">{CONTACT_EMAIL}</a> with the subject line
            &ldquo;Data Rights Request&rdquo;. We will respond within <strong>30 days</strong>.
          </p>
          <p>
            If you are dissatisfied with how we handle your request, you may lodge a complaint with the
            <strong> Nigeria Data Protection Commission (NDPC)</strong> at{' '}
            <a href="https://ndpc.gov.ng" target="_blank" rel="noopener noreferrer" className="text-primary underline">ndpc.gov.ng</a>.
          </p>
        </Section>

        <Section title="8. Data Security">
          <p>
            We implement appropriate technical and organisational measures to protect your personal data,
            including:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Encrypted data transmission (HTTPS/TLS) for all web traffic</li>
            <li>Encrypted storage for test result PDFs (S3/object storage with access controls)</li>
            <li>Hashed passwords (bcrypt) — we never store passwords in plain text</li>
            <li>Role-based access controls — staff access only the data necessary for their role</li>
            <li>Database access restricted to application servers only (no public database exposure)</li>
            <li>Regular security reviews and dependency updates</li>
          </ul>
          <p>
            In the event of a personal data breach that poses a risk to your rights, we will notify you
            and the NDPC within 72 hours of becoming aware, as required by the NDPA.
          </p>
        </Section>

        <Section title="9. Children's Privacy">
          <p>
            Our services are not directed at children under the age of 18. We do not knowingly collect
            personal data from children. If you believe a child has provided us with personal data,
            please contact us immediately and we will delete it.
          </p>
        </Section>

        <Section title="10. Links to Third-Party Sites">
          <p>
            Our website may contain links to external sites. This Privacy Policy applies only to
            FirmCare&apos;s website. We are not responsible for the privacy practices of third-party
            sites and encourage you to review their policies.
          </p>
        </Section>

        <Section title="11. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. When we do, we will revise the
            &ldquo;Last updated&rdquo; date at the top. For significant changes, we will notify registered users
            by email. Continued use of our services after changes are posted constitutes acceptance of
            the updated Policy.
          </p>
        </Section>

        <Section title="12. Contact Us">
          <p>
            For privacy-related enquiries, requests to exercise your rights, or to report a concern:
          </p>
          <address className="not-italic bg-gray-50 rounded-2xl p-5 space-y-1 text-sm">
            <p className="font-semibold text-gray-900">FirmCare Diagnostics &amp; Medical Services Ltd</p>
            <p>No 3, Bouar Close, Wuse 2, Abuja, FCT, Nigeria</p>
            <p>Email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">{CONTACT_EMAIL}</a></p>
            <p>Phone: {CONTACT_PHONE}</p>
          </address>
        </Section>

        <div className="mt-10 pt-8 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-400">
          <Link href="/terms" className="hover:text-primary transition-colors">Terms &amp; Conditions</Link>
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <Link href="/contact-us" className="hover:text-primary transition-colors">Contact Us</Link>
        </div>
      </div>
    </main>
  );
}
