// app/legals/cookies/page.tsx
import Policy, { PolicySection, PolicyList } from '@/components/legal/Policy'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main className="pb-24 md:pb-6">
        <Policy title="Cookie Policy" lastUpdated="August 5, 2026">
          <PolicySection title="1. What Are Cookies">
            <p>
              Cookies are small text files that websites place on your device to store 
              information about your preferences and activity. They help websites remember 
              you and provide a better experience.
            </p>
          </PolicySection>

          <PolicySection title="2. How We Use Cookies">
            <p>
              Auto Republic uses cookies to enhance your experience:
            </p>
            <PolicyList items={[
              "Essential cookies for platform functionality",
              "Preference cookies to remember your settings",
              "Analytics cookies to understand usage patterns",
              "Marketing cookies to show relevant promotions"
            ]} />
          </PolicySection>

          <PolicySection title="3. Types of Cookies We Use">
            <p>
              We use both session and persistent cookies:
            </p>
            <PolicyList items={[
              "Session cookies - temporary and deleted when you close your browser",
              "Persistent cookies - remain for a set period to remember preferences",
              "Third-party cookies for analytics and marketing"
            ]} />
          </PolicySection>

          <PolicySection title="4. Managing Your Cookie Preferences">
            <p>
              You can control cookie settings in your browser:
            </p>
            <PolicyList items={[
              "Most browsers allow you to block or delete cookies",
              "You can configure cookie settings in your browser preferences",
              "Opting out may affect platform functionality"
            ]} />
          </PolicySection>

          <PolicySection title="5. Cookie Categories">
            <PolicyList items={[
              "Strictly Necessary - essential for platform operation",
              "Performance - help us improve user experience",
              "Functional - remember your preferences",
              "Targeting - used for relevant advertising"
            ]} />
          </PolicySection>

          <PolicySection title="6. Updates to This Policy">
            <p>
              We may update this Cookie Policy periodically. Changes will be posted here 
              with an updated date.
            </p>
          </PolicySection>

          <PolicySection title="7. Contact Us">
            <p>
              For questions about our Cookie Policy:
            </p>
            <PolicyList items={[
              "Email: support@autorepublic.com",
              "Phone: +234 800 000 0000"
            ]} />
          </PolicySection>
        </Policy>
      </main>
      <BottomNav />
    </div>
  )
}