// app/legals/buyer-protection/page.tsx
import Policy, { PolicySection, PolicyList, PolicyNotice } from '@/components/legal/Policy'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'

export default function BuyerProtectionPage() {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main className="pb-24 md:pb-6">
        <Policy title="Buyer Protection Policy" lastUpdated="August 5, 2026">
          {/* Section 1: Our Commitment */}
          <PolicySection title="1. Our Commitment">
            <p>
              Auto Republic is committed to providing a transparent, trustworthy, and secure 
              marketplace where buyers can discover vehicles offered by sellers across Nigeria.
            </p>
            <p className="mt-2">
              Our goal is to make buying a vehicle safer by promoting transparency, encouraging 
              due diligence, and helping buyers connect with genuine sellers.
            </p>
            <p className="mt-2">
              While Auto Republic facilitates connections between buyers and sellers, the final 
              inspection, negotiation, agreement, payment, and transfer of ownership remain the 
              responsibility of the buyer and seller.
            </p>
          </PolicySection>

          {/* Section 2: Seller Verification */}
          <PolicySection title="2. Seller Verification">
            <p>
              To improve trust on our marketplace, Auto Republic may verify sellers before or 
              after they publish vehicle listings.
            </p>
            <p className="mt-2">Verification may include:</p>
            <PolicyList items={[
              "Identity verification where applicable",
              "Business registration verification for registered dealerships",
              "Review of supporting documents",
              "Monitoring seller activities for suspicious behaviour",
              "Suspending or removing accounts that violate our marketplace policies"
            ]} />
            <PolicyNotice>
              Seller verification does not guarantee the honesty of a seller or the condition, 
              ownership, or legality of any vehicle.
            </PolicyNotice>
          </PolicySection>

          {/* Section 3: Listing Standards */}
          <PolicySection title="3. Listing Standards">
            <p>
              Auto Republic expects every seller to provide truthful and accurate information.
            </p>
            <p className="mt-2">Sellers are required to:</p>
            <PolicyList items={[
              "Upload genuine photographs of the actual vehicle",
              "Provide accurate vehicle specifications",
              "State transparent pricing",
              "Disclose known defects where applicable",
              "Avoid misleading descriptions or false claims"
            ]} />
            <p className="mt-2">
              Listings that violate our policies may be edited, suspended, or removed without notice.
            </p>
          </PolicySection>

          {/* Section 4: Auto Republic's Role */}
          <PolicySection title="4. Auto Republic's Role">
            <p>
              Auto Republic is an online vehicle marketplace and advertising platform.
            </p>
            <p className="mt-2">Our role may include:</p>
            <PolicyList items={[
              "Publishing vehicle advertisements",
              "Promoting listings",
              "Connecting buyers with sellers",
              "Assisting communication where necessary",
              "Referring interested buyers to sellers",
              "Monitoring compliance with marketplace policies"
            ]} />
            <p className="mt-2 text-white/60">
              For transactions introduced through Auto Republic, we may earn commissions or 
              service fees from the seller in accordance with our agreements.
            </p>
            <p className="mt-2 font-medium text-white/80">Auto Republic does <span className="text-red-400 font-bold">not</span>:</p>
            <PolicyList items={[
              "Own listed vehicles",
              "Determine vehicle prices",
              "Inspect or certify vehicles",
              "Guarantee vehicle quality or condition",
              "Guarantee that a transaction will be completed"
            ]} />
          </PolicySection>

          {/* Section 5: Buyer Responsibilities */}
          <PolicySection title="5. Buyer Responsibilities">
            <p>
              Before purchasing any vehicle, buyers should:
            </p>
            <PolicyList items={[
              "Inspect the vehicle personally",
              "Verify ownership documents",
              "Confirm the VIN or Chassis Number where applicable",
              "Carry out an independent mechanical inspection if necessary",
              "Negotiate directly with the seller",
              "Keep copies of receipts and transaction documents",
              "Ensure they are satisfied before making payment"
            ]} />
            <PolicyNotice>
              Never rely solely on photographs or online descriptions.
            </PolicyNotice>
          </PolicySection>

          {/* Section 6: Buyer Rights */}
          <PolicySection title="6. Buyer Rights">
            <p>Every buyer has the right to:</p>
            <PolicyList items={[
              "Inspect a vehicle before payment",
              "Request available ownership and vehicle documentation",
              "Ask questions about the vehicle's history and condition",
              "Negotiate the purchase price and terms directly with the seller",
              "Walk away from a transaction if not satisfied after inspection",
              "Report suspicious listings or sellers to Auto Republic"
            ]} />
          </PolicySection>

          {/* Section 7: Report Suspicious Activity */}
          <PolicySection title="7. Report Suspicious Activity">
            <p>
              If you suspect fraud or encounter misleading information, please report it immediately.
            </p>
            <p className="mt-2">Examples include:</p>
            <PolicyList items={[
              "Fake vehicle photographs",
              "False descriptions",
              "Forged ownership documents",
              "Identity impersonation",
              "Requests for suspicious payments",
              "Fraudulent advertisements"
            ]} />
            <p className="mt-2">
              Auto Republic may investigate reported accounts and take appropriate action, 
              including suspension or permanent removal from the platform.
            </p>
          </PolicySection>

          {/* Section 8: Coming Soon - Enhanced Buyer Protection */}
          <PolicySection title="8. Coming Soon: Enhanced Buyer Protection">
            <p>
              Auto Republic is developing additional buyer protection services designed to 
              improve confidence during vehicle transactions.
            </p>

            <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/5">
              <h4 className="text-xs font-semibold text-white mb-1">Escrow Protection</h4>
              <p className="text-xs text-white/60">
                When introduced, buyers and sellers may choose to use an Auto Republic escrow 
                service that temporarily safeguards funds until agreed transaction conditions 
                have been satisfied.
              </p>
            </div>

            <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/5">
              <h4 className="text-xs font-semibold text-white mb-1">Buy Now, Pay in Parts</h4>
              <p className="text-xs text-white/60">
                Eligible buyers will be able to purchase selected vehicles through structured 
                installment payment plans, subject to approval, eligibility requirements, and 
                financing partner terms.
              </p>
            </div>

            <PolicyNotice>
              These services are currently under development and will become available only 
              after they have been officially launched by Auto Republic.
            </PolicyNotice>
          </PolicySection>

          {/* Section 9: Fraud Prevention Tips */}
          <PolicySection title="9. Fraud Prevention Tips">
            <p>To reduce the risk of fraud:</p>
            <PolicyList items={[
              "Always inspect the vehicle before making payment",
              "Verify all ownership documents carefully",
              "Compare the VIN or Chassis Number with the documents provided",
              "Request an independent mechanic to inspect the vehicle whenever possible",
              "Be cautious of prices that appear unusually low",
              "Do not allow anyone to pressure you into making immediate payment",
              "Report suspicious behaviour immediately"
            ]} />
          </PolicySection>

          {/* Section 10: Disputes */}
          <PolicySection title="10. Disputes">
            <p>
              Vehicle purchases are private agreements between buyers and sellers.
            </p>
            <p className="mt-2">
              Although Auto Republic may facilitate introductions and provide marketplace 
              services, we are not responsible for:
            </p>
            <PolicyList items={[
              "Vehicle defects",
              "Mechanical failures",
              "Hidden damage",
              "Pricing disputes",
              "Ownership disputes",
              "Delivery arrangements",
              "Warranty claims",
              "Agreements made between buyers and sellers"
            ]} />
            <p className="mt-2">
              Where reports indicate fraud, policy violations, or abuse of the platform, 
              Auto Republic may investigate and take appropriate action against the responsible 
              account.
            </p>
          </PolicySection>

          {/* Section 11: Contact Support */}
          <PolicySection title="11. Contact Support">
            <p>
              If you need assistance, wish to report suspicious activity, or have concerns 
              about a listing, please contact Auto Republic Support.
            </p>
            <PolicyList items={[
              "Email: support@autorepublic.com",
              "Phone: +234 800 000 0000",
              "Support Hours: Monday – Friday, 9:00 AM – 5:00 PM (WAT)"
            ]} />
          </PolicySection>

          {/* Final Reminder */}
          <PolicySection title="Final Reminder">
            <PolicyNotice>
              <p className="font-medium">Buying a vehicle is an important financial decision.</p>
              <p className="mt-2">
                Take your time, inspect carefully, verify documentation, ask questions, and 
                make informed decisions before making payment.
              </p>
              <p className="mt-2">
                Auto Republic is committed to providing a trusted marketplace, while buyers 
                and sellers remain responsible for the decisions and agreements they make 
                during every transaction.
              </p>
            </PolicyNotice>
          </PolicySection>
        </Policy>
      </main>
      <BottomNav />
    </div>
  )
}