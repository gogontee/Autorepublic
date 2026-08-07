// components/legal/TermsOfUse.tsx
'use client'

import Link from 'next/link'
import Policy, { PolicySection, PolicyList, PolicyNotice } from './Policy'

export default function TermsOfUse() {
  return (
    <Policy title="Terms of Service" lastUpdated="August 5, 2026">
      {/* Section 1: Introduction */}
      <PolicySection title="1. Introduction">
        <p>
          Welcome to Auto Republic ("Auto Republic", "we", "our", or "us").
        </p>
        <p className="mt-2">
          These Terms of Service govern your access to and use of Auto Republic's website, 
          mobile application, and all related products and services.
        </p>
        <p className="mt-2">
          By creating an account or using Auto Republic, you agree to be bound by these Terms.
        </p>
        <p className="mt-2">
          Auto Republic is an online vehicle marketplace and advertising platform that connects 
          vehicle buyers with sellers. We provide a platform for discovering, advertising, 
          promoting, and marketing vehicles.
        </p>
        <p className="mt-2">
          While buyers and sellers negotiate and agree on the terms of every sale directly, 
          Auto Republic may facilitate introductions, assist communication where necessary, 
          and provide marketplace services to sellers.
        </p>
        <p className="mt-2">
          Auto Republic may earn commissions or service fees from sellers for successful 
          transactions generated through the platform in accordance with these Terms or any 
          separate agreement between Auto Republic and the seller.
        </p>
        <p className="mt-2">
          Unless expressly stated otherwise, Auto Republic does not own, purchase, or take 
          possession of vehicles listed on the platform.
        </p>
      </PolicySection>

      {/* Buyer Safety Notice */}
      <PolicySection title="Buyer Safety Notice">
        <PolicyNotice>
          <p className="font-medium">Inspect Before You Pay</p>
          <p className="mt-1">
            Your safety is important to us.
          </p>
          <ul className="mt-2 space-y-1 text-yellow-400/80">
            <li>• Always inspect a vehicle physically before making payment.</li>
            <li>• Verify ownership documents and vehicle details.</li>
            <li>• Never send payment to anyone claiming to represent Auto Republic unless the payment is for an official Auto Republic service.</li>
            <li>• If you are unsure about any payment request, contact Auto Republic Support before making payment.</li>
          </ul>
        </PolicyNotice>
      </PolicySection>

      {/* Section 2: User Accounts */}
      <PolicySection title="2. User Accounts">
        <p>
          To use certain features of Auto Republic, you must create an account.
        </p>
        <p className="mt-2">By creating an account, you agree that:</p>
        <PolicyList items={[
          "You are at least 18 years old",
          "All information you provide is accurate and up to date",
          "You are responsible for maintaining the security of your account credentials",
          "You are responsible for all activities carried out under your account",
          "You will immediately notify Auto Republic of any unauthorized access to your account",
          "Auto Republic may suspend or terminate accounts that violate these Terms or any applicable policy"
        ]} />
      </PolicySection>

      {/* Section 3: Vehicle Listings */}
      <PolicySection title="3. Vehicle Listings">
        <p>
          Sellers are solely responsible for the information they publish.
        </p>
        <p className="mt-2">By listing a vehicle, you agree to:</p>
        <PolicyList items={[
          "Advertise only vehicles you have the legal right to sell",
          "Provide accurate and truthful information",
          "Upload genuine photographs of the actual vehicle",
          "State a transparent asking price",
          "Disclose known defects where applicable",
          "Respond professionally to buyer enquiries"
        ]} />
        <p className="mt-2">
          Auto Republic reserves the right to review, reject, edit, suspend, or remove listings 
          that violate our policies or applicable law.
        </p>
      </PolicySection>

      {/* Section 4: Our Role */}
      <PolicySection title="4. Our Role">
        <p>
          Auto Republic operates as a vehicle marketplace and advertising platform.
        </p>
        <p className="mt-2">Our services may include:</p>
        <PolicyList items={[
          "Publishing vehicle advertisements",
          "Promoting vehicle listings",
          "Connecting buyers with sellers",
          "Assisting communication where necessary",
          "Referring prospective buyers to sellers",
          "Monitoring compliance with marketplace policies",
          "Providing marketplace services to sellers"
        ]} />
        <p className="mt-2">
          For transactions introduced through Auto Republic, we may receive commissions or 
          marketplace service fees from the seller.
        </p>
        <p className="mt-2 font-medium text-white/80">Auto Republic does <span className="text-red-400 font-bold">not</span>:</p>
        <PolicyList items={[
          "Take ownership of listed vehicles",
          "Determine the final selling price",
          "Guarantee the quality, condition, mileage, ownership, or legality of any vehicle",
          "Guarantee that a transaction will be completed"
        ]} />
        <p className="mt-2 text-yellow-400/70 text-[11px]">
          ⚠️ Inspection, negotiation, pricing, payment, transfer of ownership, warranties, 
          delivery, and all contractual obligations relating to the sale of a vehicle remain 
          the responsibility of the buyer and seller.
        </p>
      </PolicySection>

      {/* Section 5: Buying Vehicles */}
      <PolicySection title="5. Buying Vehicles">
        <p>
          Buyers are responsible for carrying out their own due diligence before purchasing 
          any vehicle.
        </p>
        <p className="mt-2">We strongly recommend that buyers:</p>
        <PolicyList items={[
          "Inspect every vehicle before making payment",
          "Verify ownership documents",
          "Confirm the Vehicle Identification Number (VIN) or Chassis Number where applicable",
          "Carry out an independent mechanical inspection where necessary",
          "Negotiate all purchase terms directly with the seller",
          "Keep copies of all documents relating to the purchase"
        ]} />
        <p className="mt-2">
          Auto Republic does not guarantee the accuracy of seller-provided information and 
          encourages buyers to make informed decisions before purchasing.
        </p>
      </PolicySection>

      {/* Section 6: Auto Republic Wallet, Payments and Platform Fees */}
      <PolicySection title="6. Auto Republic Wallet, Payments and Platform Fees">
        <p>
          Auto Republic Wallet is used to pay for eligible Auto Republic services.
        </p>
        <p className="mt-2">These services may include:</p>
        <PolicyList items={[
          "Vehicle listing promotions",
          "Featured advertisements",
          "Premium seller tools",
          "Advertising packages",
          "Other services introduced by Auto Republic"
        ]} />
        <p className="mt-2">
          Payments for these services are deducted directly from the user's Auto Republic Wallet.
        </p>
        <p className="mt-2">
          Wallet balances are generally non-refundable except where required by applicable law 
          or expressly approved by Auto Republic.
        </p>
        <PolicyNotice>
          Vehicle purchase payments are <span className="font-medium">not</span> processed through 
          the Auto Republic Wallet unless Auto Republic officially introduces such a service 
          in the future.
        </PolicyNotice>
      </PolicySection>

      {/* Section 7: Seller Commission */}
      <PolicySection title="7. Seller Commission">
        <p>
          Where a buyer is introduced to a seller through Auto Republic, the seller agrees that 
          Auto Republic may earn a marketplace commission or service fee for the completed sale.
        </p>
        <p className="mt-2">Sellers agree to:</p>
        <PolicyList items={[
          "Pay the applicable commission due to Auto Republic",
          "Provide accurate sale information where requested for commission verification",
          "Cooperate with Auto Republic regarding commission settlement",
          "Not deliberately avoid commissions by completing transactions outside the platform after an introduction has been made through Auto Republic"
        ]} />
        <p className="mt-2 text-red-400/70 text-[11px]">
          ⚠️ Failure to comply with these obligations may result in account suspension, 
          account termination, restriction of platform services, or other lawful remedies 
          available to Auto Republic.
        </p>
        <p className="mt-2">
          Commission rates may change from time to time. Updated rates will be communicated 
          before taking effect.
        </p>
      </PolicySection>

      {/* Section 8: Seller Responsibilities */}
      <PolicySection title="8. Seller Responsibilities">
        <p>All sellers agree to:</p>
        <PolicyList items={[
          "Comply with all applicable laws and regulations",
          "Advertise honestly",
          "Maintain professional communication with buyers",
          "Honour representations made within their listings",
          "Avoid deceptive or fraudulent practices"
        ]} />
        <p className="mt-2">
          Auto Republic may suspend or permanently remove sellers who violate these obligations.
        </p>
      </PolicySection>

      {/* Section 9: Privacy */}
      <PolicySection title="9. Privacy">
        <p>
          Your personal information is processed in accordance with our Privacy Policy.
        </p>
        <p className="mt-2">
          Auto Republic collects and processes only the information reasonably necessary to 
          operate the platform and improve our services.
        </p>
        <p className="mt-2">
          We do not sell users' personal information to third parties.
        </p>
      </PolicySection>

      {/* Section 10: Acceptable Use */}
      <PolicySection title="10. Acceptable Use">
        <p>Users must not:</p>
        <PolicyList items={[
          "Publish false or misleading listings",
          "Impersonate another individual or business",
          "Harass or abuse other users",
          "Upload malicious software",
          "Attempt unauthorized access to Auto Republic systems",
          "Use the platform for unlawful purposes",
          "Circumvent Auto Republic's commission structure after introductions made through the platform"
        ]} />
        <p className="mt-2">
          Violation of these rules may result in suspension or permanent termination of your account.
        </p>
      </PolicySection>

      {/* Section 11: Future Services */}
      <PolicySection title="11. Future Services">
        <p>
          Auto Republic continuously develops new services to improve the buying and selling experience.
        </p>
        <p className="mt-2">Future services may include:</p>
        <PolicyList items={[
          "Escrow Protection",
          "Buy Now, Pay in Parts financing",
          "Enhanced buyer protection services",
          "Additional premium seller tools",
          "Financing and lending partnerships"
        ]} />
        <PolicyNotice>
          Unless officially launched and announced by Auto Republic, these services are not 
          currently available.
        </PolicyNotice>
      </PolicySection>

      {/* Section 12: Limitation of Liability */}
      <PolicySection title="12. Limitation of Liability">
        <p>
          Auto Republic provides an online marketplace that connects buyers and sellers.
        </p>
        <p className="mt-2">
          Although Auto Republic may facilitate introductions and provide marketplace services, 
          the inspection, negotiation, agreement, payment, transfer of ownership, warranties, 
          delivery, and completion of any vehicle transaction remain the responsibility of the 
          buyer and seller.
        </p>
        <p className="mt-2">
          To the fullest extent permitted by applicable law, Auto Republic shall not be liable for:
        </p>
        <PolicyList items={[
          "Vehicle defects or mechanical issues",
          "Misrepresentation by buyers or sellers",
          "Ownership disputes",
          "Pricing disagreements",
          "Failed transactions",
          "Delayed delivery",
          "Fraud committed by platform users",
          "Financial losses arising from transactions between users",
          "Any indirect, incidental, consequential, or special damages arising from the use of the platform"
        ]} />
        <p className="mt-2">
          Nothing in these Terms excludes liability that cannot legally be excluded under 
          applicable law.
        </p>
      </PolicySection>

      {/* Section 13: Suspension and Termination */}
      <PolicySection title="13. Suspension and Termination">
        <p>Auto Republic reserves the right to suspend, restrict, or permanently terminate accounts that:</p>
        <PolicyList items={[
          "Violate these Terms",
          "Engage in fraud",
          "Publish misleading information",
          "Abuse the platform",
          "Evade marketplace commissions",
          "Create security risks for other users"
        ]} />
        <p className="mt-2">
          Users may request account closure at any time by contacting Auto Republic Support.
        </p>
      </PolicySection>

      {/* Section 14: Changes to these Terms */}
      <PolicySection title="14. Changes to these Terms">
        <p>
          Auto Republic may revise these Terms from time to time.
        </p>
        <p className="mt-2">
          Updated Terms become effective immediately upon publication unless otherwise stated.
        </p>
        <p className="mt-2">
          Your continued use of the platform constitutes acceptance of the revised Terms.
        </p>
      </PolicySection>

      {/* Section 15: Governing Law */}
      <PolicySection title="15. Governing Law">
        <p>
          These Terms shall be governed by and interpreted in accordance with the laws of the 
          Federal Republic of Nigeria.
        </p>
        <p className="mt-2">
          Any dispute arising from these Terms shall be subject to the jurisdiction of the 
          competent courts of Nigeria.
        </p>
      </PolicySection>

      {/* Section 16: Contact Us */}
      <PolicySection title="16. Contact Us">
        <p>
          If you have questions regarding these Terms or any Auto Republic service, please contact us.
        </p>
        <PolicyList items={[
          "Email: support@autorepublic.com",
          "Phone: +234 800 000 0000",
          "Address: Lagos, Nigeria",
          "Support Hours: Monday – Friday, 9:00 AM – 5:00 PM (WAT)"
        ]} />
      </PolicySection>

      {/* Final Reminder */}
      <PolicySection title="Final Reminder">
        <PolicyNotice>
          <p className="font-medium">Auto Republic is committed to building a transparent and trusted vehicle marketplace.</p>
          <p className="mt-2">
            Always inspect vehicles personally, verify all documentation, ask questions, and 
            carry out your own due diligence before completing any purchase.
          </p>
          <p className="mt-2 font-medium text-yellow-400/80">
            Your informed decision is your best protection.
          </p>
        </PolicyNotice>
      </PolicySection>
    </Policy>
  )
}