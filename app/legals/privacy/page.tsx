// app/legals/privacy/page.tsx
import Policy, { PolicySection, PolicyList, PolicyNotice } from '@/components/legal/Policy'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main className="pb-24 md:pb-6">
        <Policy title="Privacy Policy" lastUpdated="August 5, 2026">
          {/* Section 1: Introduction */}
          <PolicySection title="1. Introduction">
            <p>
              Auto Republic ("Auto Republic", "we", "our", or "us") respects your privacy 
              and is committed to protecting your personal information.
            </p>
            <p className="mt-2">
              This Privacy Policy explains how we collect, use, store, disclose, and protect 
              your information when you use our website, mobile application, and related services.
            </p>
            <p className="mt-2">
              By using Auto Republic, you agree to the collection and use of your information 
              as described in this Privacy Policy.
            </p>
          </PolicySection>

          {/* Section 2: Information We Collect */}
          <PolicySection title="2. Information We Collect">
            <p>
              To provide and improve our services, we may collect the following information:
            </p>
            
            <div className="mt-3 space-y-3">
              <div>
                <h4 className="text-xs font-semibold text-white/80">Personal Information</h4>
                <PolicyList items={[
                  "Full name",
                  "Email address",
                  "Phone number",
                  "Profile photograph (where provided)",
                  "Residential location (where provided)"
                ]} />
              </div>

              <div>
                <h4 className="text-xs font-semibold text-white/80">Account Information</h4>
                <PolicyList items={[
                  "Account registration details",
                  "Login activity",
                  "Account preferences",
                  "Verification information submitted by users"
                ]} />
              </div>

              <div>
                <h4 className="text-xs font-semibold text-white/80">Vehicle and Listing Information</h4>
                <PolicyList items={[
                  "Vehicle listings you publish",
                  "Saved vehicles",
                  "Search history",
                  "Vehicle preferences",
                  "Enquiries relating to listings"
                ]} />
              </div>

              <div>
                <h4 className="text-xs font-semibold text-white/80">Wallet Information</h4>
                <p className="text-xs text-white/40 mb-1">Where applicable, we collect information relating to your Auto Republic Wallet, including:</p>
                <PolicyList items={[
                  "Wallet funding history",
                  "Promotion purchases",
                  "Advertisement payments",
                  "Wallet transaction history"
                ]} />
              </div>

              <div>
                <h4 className="text-xs font-semibold text-white/80">Technical Information</h4>
                <p className="text-xs text-white/40 mb-1">We may automatically collect:</p>
                <PolicyList items={[
                  "IP address",
                  "Browser type",
                  "Device type",
                  "Operating system",
                  "Pages visited",
                  "Date and time of visits",
                  "Referring website or source",
                  "Cookies and similar technologies"
                ]} />
              </div>

              <div>
                <h4 className="text-xs font-semibold text-white/80">Location Information</h4>
                <p className="text-xs text-white/40">
                  With your permission, we may collect your approximate location to improve 
                  search results and provide location-based services.
                </p>
              </div>
            </div>
          </PolicySection>

          {/* Section 3: How We Use Your Information */}
          <PolicySection title="3. How We Use Your Information">
            <p>We use your information to:</p>
            <PolicyList items={[
              "Create and manage your account",
              "Publish and manage vehicle listings",
              "Help users discover relevant vehicles",
              "Enable users to make enquiries about listed vehicles",
              "Process Auto Republic Wallet activities",
              "Process payments for Auto Republic services such as advertisements and listing promotions",
              "Improve our products and services",
              "Personalize your experience on the platform",
              "Send important service notifications",
              "Send platform updates and promotional communications where permitted by law or with your consent",
              "Detect fraud, abuse, and security threats",
              "Comply with legal obligations"
            ]} />
          </PolicySection>

          {/* Section 4: How We Share Information */}
          <PolicySection title="4. How We Share Information">
            <p className="font-medium text-white/80">
              Auto Republic does <span className="text-red-400 font-bold">not</span> sell, rent, or trade your personal information.
            </p>
            <p className="mt-2">We may share information only when necessary:</p>
            <PolicyList items={[
              "With your consent",
              "To comply with legal obligations",
              "To protect the rights, safety, or property of Auto Republic, our users, or the public",
              "With trusted third-party service providers that help us operate our platform, including payment processors, cloud hosting providers, analytics providers, and identity verification services where applicable",
              "As part of a merger, acquisition, restructuring, or sale of business assets where permitted by law"
            ]} />
            <p className="mt-2 text-white/40 text-xs">
              All third-party service providers are expected to protect your information appropriately.
            </p>
          </PolicySection>

          {/* Section 5: Data Security */}
          <PolicySection title="5. Data Security">
            <p>
              We take reasonable technical and organizational measures to safeguard your information.
            </p>
            <p className="mt-2">These measures include:</p>
            <PolicyList items={[
              "Encrypted data transmission where appropriate",
              "Secure authentication systems",
              "Restricted access to sensitive information",
              "Regular monitoring and security improvements",
              "Secure cloud infrastructure"
            ]} />
            <p className="mt-2 text-white/40 text-xs">
              While we strive to protect your information, no system can guarantee absolute security.
            </p>
          </PolicySection>

          {/* Section 6: Data Retention */}
          <PolicySection title="6. Data Retention">
            <p>
              We retain your information only for as long as necessary to:
            </p>
            <PolicyList items={[
              "Provide our services",
              "Maintain your account",
              "Comply with legal obligations",
              "Resolve disputes",
              "Prevent fraud",
              "Enforce our Terms of Service"
            ]} />
            <p className="mt-2">
              When information is no longer required, we will securely delete or anonymize it 
              where reasonably practicable.
            </p>
          </PolicySection>

          {/* Section 7: Your Rights */}
          <PolicySection title="7. Your Rights">
            <p>
              Subject to applicable law, you may:
            </p>
            <PolicyList items={[
              "Access your personal information",
              "Update or correct inaccurate information",
              "Request deletion of your account and personal information",
              "Withdraw consent where processing is based on consent",
              "Opt out of marketing communications",
              "Request a copy of your personal information where applicable"
            ]} />
            <p className="mt-2 text-white/40 text-xs">
              Some requests may be limited where we are legally required to retain certain information.
            </p>
          </PolicySection>

          {/* Section 8: Cookies and Similar Technologies */}
          <PolicySection title="8. Cookies and Similar Technologies">
            <p>
              Auto Republic uses cookies and similar technologies to improve your experience.
            </p>
            <p className="mt-2">Cookies help us:</p>
            <PolicyList items={[
              "Keep you signed in",
              "Remember your preferences",
              "Improve website performance",
              "Analyze platform usage",
              "Personalize content and recommendations",
              "Enhance security"
            ]} />
            <p className="mt-2 text-white/40 text-xs">
              You may control or disable cookies through your browser settings, although some 
              features may not function properly.
            </p>
          </PolicySection>

          {/* Section 9: Children's Privacy */}
          <PolicySection title="9. Children's Privacy">
            <p>
              Auto Republic is intended only for individuals who are at least 18 years old.
            </p>
            <p className="mt-2">
              We do not knowingly collect personal information from children under 18 years of age.
            </p>
            <p className="mt-2">
              If we become aware that information has been collected from a child without 
              appropriate authorization, we will take reasonable steps to delete it.
            </p>
          </PolicySection>

          {/* Section 10: Third-Party Services */}
          <PolicySection title="10. Third-Party Services">
            <p>
              Our platform may contain links to third-party websites or integrate services 
              provided by third parties.
            </p>
            <p className="mt-2">
              Auto Republic is not responsible for the privacy practices or content of 
              third-party websites or services.
            </p>
            <p className="mt-2">
              Users should review the privacy policies of those third parties before providing 
              personal information.
            </p>
          </PolicySection>

          {/* Section 11: Changes to this Privacy Policy */}
          <PolicySection title="11. Changes to this Privacy Policy">
            <p>
              We may update this Privacy Policy from time to time.
            </p>
            <p className="mt-2">
              When material changes are made, we will publish the updated version on our 
              platform and update the "Last Updated" date.
            </p>
            <p className="mt-2">
              Your continued use of Auto Republic after changes become effective constitutes 
              acceptance of the revised Privacy Policy.
            </p>
          </PolicySection>

          {/* Section 12: Contact Us */}
          <PolicySection title="12. Contact Us">
            <p>
              If you have questions, requests, or concerns regarding this Privacy Policy or 
              your personal information, please contact Auto Republic Support.
            </p>
            <PolicyList items={[
              "Email: support@autorepublic.com",
              "Phone: +234 800 000 0000",
              "Address: Lagos, Nigeria",
              "Support Hours: Monday – Friday, 9:00 AM – 5:00 PM (WAT)"
            ]} />
          </PolicySection>

          {/* Final Reminder */}
          <PolicySection title="Your Privacy Matters">
            <PolicyNotice>
              <p className="font-medium">Auto Republic values your trust.</p>
              <p className="mt-2">
                We are committed to handling your personal information responsibly, 
                transparently, and securely while providing a trusted marketplace for 
                vehicle buyers and sellers.
              </p>
            </PolicyNotice>
          </PolicySection>
        </Policy>
      </main>
      <BottomNav />
    </div>
  )
}