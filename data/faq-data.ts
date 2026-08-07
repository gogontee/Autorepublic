// data/faq-data.ts
export interface FAQItem {
  id: string
  question: string
  answer: string
  category: 'general' | 'buying' | 'selling' | 'account' | 'payments' | 'advertising'
  icon?: string
}

export const faqData: FAQItem[] = [
  // General Questions
  {
    id: 'general-1',
    question: 'What is Auto Republic?',
    answer: 'Auto Republic is Nigeria\'s modern automotive marketplace where vehicle sellers connect with serious buyers across Nigeria. We provide a platform for discovering, comparing, and advertising vehicles with confidence.',
    category: 'general'
  },
  {
    id: 'general-2',
    question: 'Is Auto Republic free to use?',
    answer: 'Yes! Creating an account and browsing vehicles on Auto Republic is completely free. Listing your vehicle is also free. We only charge for premium features like promoted listings and advertising packages.',
    category: 'general'
  },
  {
    id: 'general-3',
    question: 'Who can use Auto Republic?',
    answer: 'Anyone can use Auto Republic! Whether you\'re a private seller looking to sell your car, a dealership managing multiple vehicles, or a buyer searching for your next vehicle, Auto Republic is designed for you.',
    category: 'general'
  },
  {
    id: 'general-4',
    question: 'Is Auto Republic available nationwide?',
    answer: 'Yes! Auto Republic serves buyers and sellers across all states in Nigeria. From Lagos to Maiduguri, we connect automotive enthusiasts nationwide.',
    category: 'general'
  },

  // Buying Questions
  {
    id: 'buying-1',
    question: 'How do I find a vehicle on Auto Republic?',
    answer: 'You can browse vehicles by category, brand, model, price range, location, and more. Use our search bar or advanced filters to narrow down your options. You can also save your favorite vehicles for later.',
    category: 'buying'
  },
  {
    id: 'buying-2',
    question: 'Are the vehicles on Auto Republic verified?',
    answer: 'We encourage sellers to provide accurate information and genuine photos. While we monitor listings for compliance, we always recommend inspecting the vehicle in person and verifying all documentation before making a purchase.',
    category: 'buying'
  },
  {
    id: 'buying-3',
    question: 'How do I contact a seller?',
    answer: 'Each vehicle listing includes a "Contact Seller" button. You can also view the seller\'s phone number and send them a message directly through the platform. For the best experience, use our in-platform messaging system.',
    category: 'buying'
  },
  {
    id: 'buying-4',
    question: 'What should I check before buying a vehicle?',
    answer: 'Always inspect the vehicle in person, verify ownership documents, check the VIN or Chassis Number, take a test drive, and consider an independent mechanical inspection. Never make payment without physical inspection.',
    category: 'buying'
  },
  {
    id: 'buying-5',
    question: 'Can I negotiate the price?',
    answer: 'Yes! Prices listed on Auto Republic are typically starting points for negotiation. We encourage buyers and sellers to communicate and negotiate terms directly.',
    category: 'buying'
  },

  // Selling Questions
  {
    id: 'selling-1',
    question: 'How do I list my vehicle for sale?',
    answer: 'Simply create an account, navigate to the Sell page, and fill out the listing form. Add photos, describe your vehicle accurately, set your price, and publish your listing. It takes just a few minutes!',
    category: 'selling'
  },
  {
    id: 'selling-2',
    question: 'How much does it cost to list a vehicle?',
    answer: 'Listing a vehicle on Auto Republic is completely free. You can upgrade to a promoted listing or purchase advertising packages for increased visibility.',
    category: 'selling'
  },
  {
    id: 'selling-3',
    question: 'How long does my listing stay active?',
    answer: 'Your listing remains active until the vehicle is sold or you choose to remove it. We recommend keeping your listing updated with fresh photos and accurate information.',
    category: 'selling'
  },
  {
    id: 'selling-4',
    question: 'What information do I need to list my vehicle?',
    answer: 'You\'ll need basic vehicle details: make, model, year, mileage, condition, price, and description. High-quality photos are essential. You can also add extras like service history, modifications, and more.',
    category: 'selling'
  },
  {
    id: 'selling-5',
    question: 'Can I edit my listing after publishing?',
    answer: 'Yes! You can edit your listing anytime from your dashboard. Update photos, adjust price, or modify details to keep your listing current.',
    category: 'selling'
  },

  // Account Questions
  {
    id: 'account-1',
    question: 'How do I create an account?',
    answer: 'Click the "Join Now" or "Sign Up" button, fill in your details, and verify your email. You\'ll be ready to start listing and browsing vehicles in minutes.',
    category: 'account'
  },
  {
    id: 'account-2',
    question: 'How do I reset my password?',
    answer: 'Click "Forgot Password" on the login page. Enter your registered email, and we\'ll send you a link to reset your password securely.',
    category: 'account'
  },
  {
    id: 'account-3',
    question: 'How do I update my profile information?',
    answer: 'Log in to your account, navigate to Profile Settings, and update your personal information, contact details, and profile picture.',
    category: 'account'
  },
  {
    id: 'account-4',
    question: 'Can I delete my account?',
    answer: 'Yes. You can request account deletion by contacting our support team. We\'ll process your request in accordance with our privacy policy.',
    category: 'account'
  },

  // Payments & Wallet Questions
  {
    id: 'payments-1',
    question: 'What is the Auto Republic Wallet?',
    answer: 'The Auto Republic Wallet is your secure in-platform wallet for paying for premium services like promoted listings and advertising packages. Payments are deducted directly from your wallet balance.',
    category: 'payments'
  },
  {
    id: 'payments-2',
    question: 'How do I fund my wallet?',
    answer: 'Go to My Wallet in your dashboard, click "Add Funds", enter the amount, and complete the payment via our secure payment gateway (Paystack).',
    category: 'payments'
  },
  {
    id: 'payments-3',
    question: 'Is my payment information secure?',
    answer: 'Absolutely. All payments are processed through Paystack, a PCI-DSS compliant payment gateway. We never store your card details on our servers.',
    category: 'payments'
  },
  {
    id: 'payments-4',
    question: 'Are wallet funds refundable?',
    answer: 'Wallet balances are generally non-refundable. However, if you experience issues, please contact our support team and we\'ll review your case.',
    category: 'payments'
  },

  // Advertising Questions
  {
    id: 'advertising-1',
    question: 'What are promoted listings?',
    answer: 'Promoted listings are featured advertisements that appear at the top of search results and on the homepage. They give your vehicle maximum visibility to potential buyers.',
    category: 'advertising'
  },
  {
    id: 'advertising-2',
    question: 'How much does advertising cost?',
    answer: 'We offer flexible advertising packages starting at ₦100,000 for 7 days, ₦350,000 for 30 days, and ₦800,000 for 90 days. Prices may vary based on promotion.',
    category: 'advertising'
  },
  {
    id: 'advertising-3',
    question: 'How do I track my ad performance?',
    answer: 'Visit the Ads Status page in your dashboard to view impressions, clicks, and engagement metrics for your active and completed advertisements.',
    category: 'advertising'
  },
  {
    id: 'advertising-4',
    question: 'What ad formats are available?',
    answer: 'We support image ads, video ads, and text-based ads. Each format follows a 10:1.5 ratio for optimal display across all devices.',
    category: 'advertising'
  },

  // Safety & Trust Questions
  {
    id: 'safety-1',
    question: 'How does Auto Republic protect buyers?',
    answer: 'We promote safer vehicle purchases through seller verification, listing standards, buyer education, and fraud awareness. We encourage due diligence and provide resources to help you make informed decisions.',
    category: 'general'
  },
  {
    id: 'safety-2',
    question: 'What should I do if I suspect fraud?',
    answer: 'Contact our support team immediately. Report suspicious listings, sellers, or activities. We\'ll investigate and take appropriate action to protect our community.',
    category: 'general'
  },
  {
    id: 'safety-3',
    question: 'Does Auto Republic verify sellers?',
    answer: 'Yes, we may verify sellers before or after they publish listings. Verification may include identity verification, business registration checks, and ongoing monitoring.',
    category: 'general'
  }
]