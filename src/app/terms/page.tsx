import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'FirmCare Diagnostics Terms and Conditions — your rights and obligations when using our diagnostic booking platform and laboratory services.',
  alternates: { canonical: '/terms' },
  robots: { index: true, follow: true },
};

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

export default function TermsPage() {
  return (
    <main className="bg-white min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-b border-purple-100">
        <div className="max-w-3xl mx-auto px-6 py-14 sm:py-20">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">Terms &amp; Conditions</h1>
          <p className="text-gray-500 text-sm">
            Effective date: <strong>{EFFECTIVE_DATE}</strong> &nbsp;·&nbsp; Last updated: <strong>{EFFECTIVE_DATE}</strong>
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-6 py-12 sm:py-16">

        <p className="text-sm text-gray-600 leading-relaxed mb-10">
          These Terms &amp; Conditions (&ldquo;Terms&rdquo;) govern your access to and use of the FirmCare Diagnostics
          &amp; Medical Services Ltd (&ldquo;FirmCare&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) website and diagnostic booking
          platform. By creating an account, making a booking, or using any part of our service, you
          agree to be bound by these Terms. If you do not agree, please do not use our services.
        </p>

        <Section title="1. About FirmCare">
          <p>
            FirmCare Diagnostics &amp; Medical Services Ltd is a private limited company registered in
            Nigeria, providing diagnostic testing and laboratory screening services. Our registered
            address is No 3, Bouar Close, off Adetokunbo Crescent, Wuse 2, Abuja, FCT, Nigeria.
          </p>
          <p>
            FirmCare operates as a diagnostics facilitator. Our laboratory tests are carried out by
            qualified medical professionals. <strong>Results provided are for informational and diagnostic
            support purposes only and do not constitute medical advice, diagnosis, or treatment.</strong>{' '}
            Always consult a qualified healthcare provider about your health.
          </p>
        </Section>

        <Section title="2. Eligibility">
          <p>
            You must be at least <strong>18 years of age</strong> to create an account and book services
            independently. Persons under 18 may use our services only with the express consent and
            supervision of a parent or legal guardian, who accepts these Terms on their behalf.
          </p>
          <p>
            By using our services, you confirm that the information you provide is accurate, current,
            and complete, and that you have the legal capacity to enter into a binding agreement.
          </p>
        </Section>

        <Section title="3. Account Registration">
          <ul className="list-disc pl-5 space-y-2">
            <li>You are responsible for maintaining the confidentiality of your account password and for all activities that occur under your account.</li>
            <li>You must notify us immediately at <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">{CONTACT_EMAIL}</a> if you suspect any unauthorised access to your account.</li>
            <li>Each person may only hold one active account. Creating multiple accounts to circumvent restrictions is prohibited.</li>
            <li>You must verify your email address before accessing booking features. Accounts with unverified emails will have limited functionality.</li>
          </ul>
        </Section>

        <Section title="4. Bookings">
          <p><strong>4.1 Making a Booking</strong></p>
          <p>
            Bookings are subject to availability. A booking is confirmed only upon successful payment
            and receipt of a confirmation email. We reserve the right to refuse or cancel bookings at
            our discretion, in which case a full refund will be issued.
          </p>
          <p><strong>4.2 Appointment Dates</strong></p>
          <p>
            Please arrive or be ready for sample collection at the agreed date and time. Arriving more
            than 30 minutes late without prior notice may result in forfeiture of the appointment slot,
            subject to our rescheduling policy.
          </p>
          <p><strong>4.3 Home Collection</strong></p>
          <p>
            Home sample collection is available within our designated service areas. An additional home
            collection fee may apply and is displayed at checkout. You are responsible for ensuring
            access is available at the agreed time.
          </p>
          <p><strong>4.4 Sample Requirements</strong></p>
          <p>
            Certain tests require fasting or specific preparation. Instructions will be included in
            your booking confirmation email. Failure to follow preparation guidelines may result in
            invalid test results, which may require re-sampling at your own cost.
          </p>
        </Section>

        <Section title="5. Pricing and Payment">
          <p>
            All prices are displayed in Nigerian Naira (₦) and include any applicable taxes unless
            otherwise stated. Prices are subject to change without notice, but confirmed bookings will
            be honoured at the price displayed at the time of payment.
          </p>
          <p>
            Payments are processed securely by <strong>Paystack</strong>. FirmCare does not store your
            card details. By proceeding with payment, you also agree to Paystack&apos;s Terms of Service.
          </p>
          <p>
            Promotional codes and discounts are subject to their specific terms and cannot be combined
            unless explicitly stated. FirmCare reserves the right to revoke promotional codes at any
            time if misuse is suspected.
          </p>
        </Section>

        <Section title="6. Cancellations and Refunds">
          <p><strong>6.1 Cancellation by You</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>More than 48 hours before appointment:</strong> Full refund, minus any payment processing fees.</li>
            <li><strong>24–48 hours before appointment:</strong> 50% refund.</li>
            <li><strong>Less than 24 hours before appointment:</strong> No refund, but the booking may be rescheduled once within 30 days.</li>
            <li><strong>No-show (no prior notice):</strong> No refund, no rescheduling credit.</li>
          </ul>
          <p>
            To cancel, email <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">{CONTACT_EMAIL}</a> or
            call <strong>{CONTACT_PHONE}</strong> with your booking reference.
          </p>
          <p><strong>6.2 Cancellation by FirmCare</strong></p>
          <p>
            If we cancel or cannot fulfil your booking (e.g. due to equipment failure, staff
            unavailability, or force majeure), you will receive a <strong>full refund</strong> within 5–10 working
            days, or the option to reschedule at no additional cost.
          </p>
          <p><strong>6.3 Refund Processing</strong></p>
          <p>
            Approved refunds are processed to the original payment method within 5–10 working days,
            subject to your bank&apos;s processing times.
          </p>
        </Section>

        <Section title="7. Test Results">
          <p>
            Test results will be delivered securely via your patient dashboard. Turnaround times are
            estimates and may vary due to laboratory workload or the complexity of the test. FirmCare
            will notify you by email when results are available.
          </p>
          <p>
            <strong>Results are for your personal use only.</strong> You may download and share your results with
            your healthcare provider. FirmCare laboratory staff are not in a position to provide
            clinical interpretation of results — please consult your doctor.
          </p>
          <p>
            In the rare event of a laboratory error requiring re-testing, FirmCare will arrange and
            cover the cost of a repeat sample collection.
          </p>
        </Section>

        <Section title="8. Referral Programme">
          <p>
            FirmCare operates a referral programme that allows registered users to earn referral rewards
            when they refer new customers who complete a paid booking. The following conditions apply:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Self-referral (using your own code) is strictly prohibited and will result in reward cancellation and potential account suspension.</li>
            <li>Referral rewards are credited as pending upon successful booking payment and confirmed upon booking completion.</li>
            <li>Rewards are subject to a minimum withdrawal threshold and are paid via bank transfer to your registered account.</li>
            <li>FirmCare reserves the right to modify or terminate the referral programme at any time with 30 days&apos; notice.</li>
            <li>Abuse of the referral programme (including creating fake accounts) will result in forfeiture of all rewards and account termination.</li>
          </ul>
        </Section>

        <Section title="9. Agent Programme">
          <p>
            Registered agents who promote FirmCare services are subject to a separate Agent Agreement
            in addition to these Terms. Agents must accurately represent FirmCare&apos;s services and must
            not make claims not supported by our published materials. Misrepresentation may result in
            termination of agent status and forfeiture of unpaid commissions.
          </p>
        </Section>

        <Section title="10. Prohibited Conduct">
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Use the platform for any unlawful purpose or in violation of Nigerian law</li>
            <li>Impersonate any person or entity or misrepresent your identity</li>
            <li>Attempt to gain unauthorised access to any part of our systems</li>
            <li>Use automated tools (bots, scrapers) to access the website without written permission</li>
            <li>Post or transmit any content that is defamatory, abusive, or infringes third-party rights</li>
            <li>Interfere with the security or proper functioning of the platform</li>
            <li>Engage in any activity intended to defraud FirmCare or other users</li>
          </ul>
          <p>
            Violation of these prohibitions may result in immediate account suspension and legal action.
          </p>
        </Section>

        <Section title="11. Intellectual Property">
          <p>
            All content on this website — including text, images, logos, software code, and design — is
            the property of FirmCare Diagnostics &amp; Medical Services Ltd or its licensors and is
            protected by Nigerian and international copyright law. You may not reproduce, distribute,
            or create derivative works from our content without prior written permission.
          </p>
        </Section>

        <Section title="12. Medical Disclaimer">
          <p>
            <strong>FirmCare does not provide medical advice.</strong> The information and test results
            available through our platform are intended to support your healthcare provider&apos;s clinical
            decision-making, not to replace professional medical judgement. Do not delay seeking medical
            attention or disregard medical advice based on information from this platform.
          </p>
          <p>
            If you are experiencing a medical emergency, call emergency services immediately (Nigeria
            Emergency: <strong>112</strong>) or go to your nearest hospital.
          </p>
        </Section>

        <Section title="13. Limitation of Liability">
          <p>
            To the maximum extent permitted by Nigerian law, FirmCare shall not be liable for:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Any indirect, incidental, or consequential loss arising from use of our services</li>
            <li>Loss of profits, data, or business opportunities</li>
            <li>Decisions made based on test results without independent medical consultation</li>
            <li>Service interruptions due to circumstances beyond our reasonable control (force majeure), including power outages, internet disruptions, or natural disasters</li>
          </ul>
          <p>
            Our total liability for any claim arising from these Terms shall not exceed the amount you
            paid for the specific service giving rise to the claim.
          </p>
        </Section>

        <Section title="14. Indemnification">
          <p>
            You agree to indemnify and hold FirmCare, its directors, employees, and agents harmless
            from any claims, losses, damages, liabilities, and expenses (including legal fees) arising
            from your breach of these Terms or misuse of our services.
          </p>
        </Section>

        <Section title="15. Privacy">
          <p>
            Our collection and use of your personal data is governed by our{' '}
            <Link href="/privacy" className="text-primary underline">Privacy Policy</Link>, which forms part
            of these Terms. By using our services, you acknowledge and agree to the Privacy Policy.
          </p>
        </Section>

        <Section title="16. Governing Law and Dispute Resolution">
          <p>
            These Terms are governed by and construed in accordance with the laws of the
            <strong> Federal Republic of Nigeria</strong>. Any dispute arising from or in connection with these Terms
            shall first be subject to good-faith negotiation. If unresolved within 30 days, the dispute
            shall be referred to arbitration in Abuja, FCT, under the Arbitration and Mediation Act 2023.
          </p>
          <p>
            Nothing in this clause limits your right to seek urgent injunctive relief from a Nigerian
            court of competent jurisdiction.
          </p>
        </Section>

        <Section title="17. Changes to These Terms">
          <p>
            We reserve the right to modify these Terms at any time. Changes will be posted on this
            page with an updated effective date. For material changes, we will notify registered users
            by email at least 14 days in advance. Continued use of our services after the effective
            date of any change constitutes acceptance of the updated Terms.
          </p>
        </Section>

        <Section title="18. Contact">
          <p>For any questions about these Terms, please contact us:</p>
          <address className="not-italic bg-gray-50 rounded-2xl p-5 space-y-1 text-sm">
            <p className="font-semibold text-gray-900">FirmCare Diagnostics &amp; Medical Services Ltd</p>
            <p>No 3, Bouar Close, Wuse 2, Abuja, FCT, Nigeria</p>
            <p>Email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">{CONTACT_EMAIL}</a></p>
            <p>Phone: {CONTACT_PHONE}</p>
          </address>
        </Section>

        <div className="mt-10 pt-8 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-400">
          <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <Link href="/contact-us" className="hover:text-primary transition-colors">Contact Us</Link>
        </div>
      </div>
    </main>
  );
}
