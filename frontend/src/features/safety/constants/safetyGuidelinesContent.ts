export const SAFETY_LAST_UPDATED = '08 August 2026';

export type SafetyWarningContent = {
  title: string;
  text: string;
  tone: 'caution' | 'danger' | 'positive';
};

export type SafetyContentGroup = {
  title: string;
  bullets: string[];
};

export type SafetyLinkContent = {
  label: string;
  to: string;
};

export type SafetySectionContent = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
  groups?: SafetyContentGroup[];
  warning?: SafetyWarningContent;
  links?: SafetyLinkContent[];
};

export const safetyGuidelinesSections: SafetySectionContent[] = [
  {
    id: 'introduction',
    title: 'Introduction',
    paragraphs: [
      'Campus Hub is built to help students buy and sell useful items safely within their campus community. To keep the marketplace trusted, every user should act honestly and respectfully while listing items, buying products, making payments, submitting reviews, or contacting other users.',
      'Avoid transactions that feel unsafe and report suspicious listings, users, reviews, payment issues, or pickup behavior. Campus Hub may review and moderate activity that threatens users or the marketplace.',
    ],
  },
  {
    id: 'account-safety',
    title: 'Account Safety',
    paragraphs: [
      'Your verified account represents you in the Campus Hub community. Protect it as carefully as your college email and payment accounts.',
    ],
    bullets: [
      'Use a strong, unique password and never share it with another person.',
      'Never share an email, phone, payment, or login OTP.',
      'Do not let another person use your account and do not create fake accounts or impersonate another student.',
      'Log out from shared devices and use Logout from all devices if you notice suspicious activity.',
      'Keep the email address and phone number connected to your account secure and current.',
      'Contact support immediately if you notice a login, profile, listing, or order action you do not recognize.',
    ],
    warning: {
      title: 'Campus Hub Support will never ask for your password or OTP',
      text: 'Do not send credentials in a listing, report, review, support ticket, phone call, or message—even if someone claims they need them to verify your account.',
      tone: 'caution',
    },
    links: [
      { label: 'Open account settings', to: '/student/settings' },
      { label: 'Contact support', to: '/student/support' },
    ],
  },
  {
    id: 'buying-safely',
    title: 'Buying Safely',
    paragraphs: [
      'Read the product title, description, condition, price, images, pickup location, quantity, and listing status carefully. Review the seller’s verified badge, Campus Trust Score, rating, and completed-order feedback before deciding.',
      'Do not rush into deals that appear unusually cheap or pressure you to leave Campus Hub. If messaging is added later, ask clear product questions before purchasing and keep sensitive information out of the conversation.',
    ],
    groups: [
      {
        title: 'Buyer checklist',
        bullets: [
          'Product condition and real images',
          'Price and whether it is negotiable',
          'Seller trust score, verified badge, and rating',
          'General, safe pickup location',
          'Listing, order, and payment status',
          'The Campus Hub Refund Policy',
        ],
      },
    ],
    warning: {
      title: 'Use the Product Details page',
      text: 'Start Buy Now from the official Product Details page. Do not follow random payment links or confirm pickup until you have received and inspected the item.',
      tone: 'positive',
    },
    links: [
      { label: 'Browse your marketplace', to: '/student/marketplace' },
      { label: 'Read the Refund Policy', to: '/refund-policy' },
    ],
  },
  {
    id: 'selling-safely',
    title: 'Selling Safely',
    paragraphs: [
      'A safe sale starts with an accurate listing. Use your own product images, explain defects honestly, choose the correct condition and category, and set a fair price.',
      'Share only a general public pickup area. Do not post a hostel room number, exact private address, phone number, or personal schedule in a public listing.',
    ],
    groups: [
      {
        title: 'Seller checklist before posting',
        bullets: [
          'The title clearly identifies the item.',
          'The description and condition are accurate.',
          'Images show the actual item.',
          'The price is fair and not misleading.',
          'The pickup location is general, public, and safe.',
          'The item is owned by you and allowed on Campus Hub.',
          'The listing will be marked sold or inactive when unavailable.',
        ],
      },
    ],
    warning: {
      title: 'Never request private credentials',
      text: 'A seller must never ask a buyer for a password, OTP, UPI PIN, full card number, bank credentials, or unnecessary identity information.',
      tone: 'caution',
    },
    links: [{ label: 'Create a safe listing', to: '/student/sell' }],
  },
  {
    id: 'payment-safety',
    title: 'Payment Safety',
    paragraphs: [
      'Use the Campus Hub payment flow where it is available. Payments are processed through the configured payment gateway, and Campus Hub does not store full card details, UPI PINs, or banking credentials.',
      'Campus Hub keeps only the payment metadata needed to operate and support an order, such as payment status, order reference, gateway order ID, payment ID, amount, and timestamps.',
    ],
    bullets: [
      'Never share card details, UPI PINs, payment OTPs, passwords, or banking credentials.',
      'Do not trust a screenshot or frontend message alone as proof of payment.',
      'Payment success must be confirmed by backend verification or a verified gateway webhook.',
      'Do not manually mark a payment complete or confirm pickup before receiving the item.',
      'If money is deducted but the order is not updated, stop retrying and create a Payment Issue support ticket.',
    ],
    warning: {
      title: 'Verified backend status is the source of truth',
      text: 'A browser success screen alone does not prove payment. Check the verified order or payment status in Campus Hub before handing over an item.',
      tone: 'caution',
    },
    links: [
      { label: 'My payments', to: '/student/payments' },
      { label: 'My support tickets', to: '/student/support' },
      { label: 'Public support', to: '/contact-support' },
      { label: 'Refund Policy', to: '/refund-policy' },
    ],
  },
  {
    id: 'pickup-safety',
    title: 'Pickup and Meeting Safety',
    paragraphs: [
      'Meet in a public, well-lit campus area, preferably during daytime. If you are meeting someone you do not know, tell a friend where you are going and leave if the situation feels unsafe.',
    ],
    groups: [
      {
        title: 'Safer pickup places',
        bullets: [
          'Campus common areas',
          'Library entrance',
          'Cafeteria area',
          'Department lobby',
          'Hostel common area or reception',
          'A college-approved pickup point when available',
        ],
      },
      {
        title: 'At the handover',
        bullets: [
          'Avoid isolated locations and do not publicly share a hostel room number.',
          'Inspect the item and included parts before confirming pickup.',
          'Do not carry unnecessary cash when a verified online payment is being used.',
          'End the meeting and report the behavior if you feel pressured or unsafe.',
        ],
      },
    ],
    warning: {
      title: 'Keep exact locations private',
      text: 'Hostel or campus area should be private by default. Share only the limited pickup detail needed with the other order participant at the appropriate time.',
      tone: 'caution',
    },
  },
  {
    id: 'personal-information',
    title: 'Personal Information Safety',
    paragraphs: [
      'Share only the information required to complete a safe campus transaction. Never publish or send credentials, sensitive financial information, government identifiers, or private documents.',
    ],
    groups: [
      {
        title: 'Never share publicly',
        bullets: [
          'Passwords or OTPs',
          'Full address or hostel room number',
          'Bank details, card details, or UPI PIN',
          'Government ID numbers or private documents',
          'Personal phone number or email when it is not necessary',
        ],
      },
      {
        title: 'Profile visibility controls',
        bullets: [
          'Bio, LinkedIn URL, and GitHub URL',
          'Hostel or campus area',
          'Department or branch and year of study',
        ],
      },
      {
        title: 'Always visible on a seller profile',
        bullets: [
          'Full name, college name, and verified badge',
          'Campus Trust Score, seller rating, and total reviews',
          'Active listings',
        ],
      },
    ],
    links: [
      { label: 'Review privacy settings', to: '/student/settings' },
      { label: 'Open your profile', to: '/student/profile' },
      { label: 'Privacy Policy', to: '/privacy-policy' },
    ],
  },
  {
    id: 'prohibited-items',
    title: 'Prohibited Items',
    paragraphs: [
      'Do not list, request, buy, or sell items that are illegal, dangerous, stolen, deceptive, restricted, or incompatible with college or Campus Hub rules.',
    ],
    bullets: [
      'Stolen items, fake or counterfeit products, and illegal items.',
      'Weapons, weapon-like items, unsafe or dangerous goods, and hazardous chemicals.',
      'Alcohol, drugs, tobacco, restricted substances, or prescription medication.',
      'Leaked exam papers, answer keys, academic cheating material, fake certificates, fake IDs, or forged documents.',
      'Adult or explicit content and hateful, abusive, or extremist material.',
      'Personal data, government IDs, private documents, or unauthorized account access.',
      'Anything that violates law, college rules, or Campus Hub policy.',
    ],
    warning: {
      title: 'Prohibited listings can lead to account action',
      text: 'Campus Hub may remove or block the listing, preserve relevant moderation evidence, and warn, suspend, or block the responsible account.',
      tone: 'danger',
    },
  },
  {
    id: 'listing-accuracy',
    title: 'Listing Accuracy',
    paragraphs: [
      'The title, category, description, condition, images, price, quantity, and general pickup location must accurately represent the item. Duplicate fake listings, copied or misleading images, and suspected stolen items may be sent for moderation.',
    ],
    groups: [
      {
        title: 'Listing status meanings',
        bullets: [
          'ACTIVE — visible and available to eligible buyers.',
          'SOLD — no longer buyable.',
          'INACTIVE — temporarily unavailable.',
          'UNDER_REVIEW — not buyable while an administrator reviews it.',
          'BLOCKED — removed from the public marketplace because of a policy or safety issue.',
        ],
      },
    ],
  },
  {
    id: 'reviews-ratings',
    title: 'Reviews and Ratings Safety',
    paragraphs: [
      'Reviews should be based on completed orders and should help other students understand the transaction. Keep reviews truthful, relevant, respectful, and free of private personal details.',
    ],
    bullets: [
      'Do not create fake reviews or demand a false positive review.',
      'Do not use a review for threats, harassment, retaliation, or abusive language.',
      'Do not reveal phone numbers, addresses, payment details, or other private information.',
      'Campus Hub may hide abusive reviews, reject fake reviews, warn users, or suspend accounts for repeated review abuse.',
    ],
  },
  {
    id: 'reports-moderation',
    title: 'Reports and Moderation',
    paragraphs: [
      'Use reporting tools when a listing, seller, review, or interaction appears unsafe or violates platform rules. Students can submit reports, but only authorized ADMIN or SUPER_ADMIN accounts can take moderation actions.',
    ],
    groups: [
      {
        title: 'You can report',
        bullets: [
          'Fake or duplicate listings and wrong product details',
          'Suspicious sellers, stolen-item concerns, or prohibited items',
          'Misleading images, abusive content, harassment, or unsafe behavior',
          'Price scams, fake reviews, and other marketplace manipulation',
        ],
      },
      {
        title: 'Where to report',
        bullets: [
          'Product Details and seller public profiles',
          'Review sections and report forms',
          'My Reports or the authenticated support workspace',
          'Public Contact Support when you cannot log in',
        ],
      },
    ],
    warning: {
      title: 'Reports must be honest',
      text: 'False, duplicate, retaliatory, or abusive reports may be rejected and can lead to warnings or account restrictions.',
      tone: 'caution',
    },
    links: [
      { label: 'My reports', to: '/student/reports' },
      { label: 'Report suspicious activity', to: '/student/support' },
      { label: 'Public support', to: '/contact-support' },
    ],
  },
  {
    id: 'support-escalation',
    title: 'Support and Escalation',
    paragraphs: [
      'Contact support when you cannot resolve a platform-related account, transaction, safety, or technical issue through the available page controls.',
    ],
    bullets: [
      'OTP, signup, login, account access, or incorrect blocking issues.',
      'Payment deducted but order not updated, duplicate payment, or another payment concern.',
      'Order issues, seller or buyer no-show, or unsafe pickup behavior.',
      'Fake listings, review problems, report or moderation concerns, and technical bugs.',
    ],
    warning: {
      title: 'Keep support messages safe',
      text: 'Do not include a password, OTP, UPI PIN, full card number, bank credentials, or other sensitive authentication information in a support request.',
      tone: 'caution',
    },
    links: [
      { label: 'Logged-in support', to: '/student/support' },
      { label: 'Public contact form', to: '/contact-support' },
    ],
  },
  {
    id: 'consequences',
    title: 'Consequences for Unsafe Behavior',
    paragraphs: [
      'Campus Hub may act when behavior threatens users, marketplace integrity, payments, or the safety of the college community. Moderation actions should be role-protected and recorded for accountability.',
    ],
    groups: [
      {
        title: 'Possible actions',
        bullets: [
          'Warning or support-ticket rejection',
          'Listing placed under review or blocked',
          'Abusive or fake review hidden',
          'False or abusive report rejected',
          'Temporary account suspension or account blocking',
          'An administrative moderation action recorded in the audit history',
        ],
      },
      {
        title: 'Behavior that can trigger action',
        bullets: [
          'Fake listings, scams, prohibited items, or payment manipulation',
          'Harassment, abusive language, threats, or unsafe pickup conduct',
          'Repeated false reports, fake reviews, or account impersonation',
          'Sharing illegal, dangerous, or seriously unsafe content',
        ],
      },
    ],
  },
  {
    id: 'emergency-issues',
    title: 'Emergency and Serious Safety Issues',
    paragraphs: [
      'Campus Hub Support can help investigate platform-related activity, preserve reports, restrict listings or accounts, and guide users to available product controls. It is not an emergency service.',
      'For immediate danger, threats, violence, theft, or another serious safety concern, contact campus security, college authorities, or local emergency services as appropriate. Also report the issue to Campus Hub Support when safe so platform action can be considered.',
    ],
    warning: {
      title: 'Do not wait for a support reply during an emergency',
      text: 'Move to a safe location and contact the appropriate campus or local emergency authority. Campus Hub does not provide emergency response services.',
      tone: 'danger',
    },
  },
  {
    id: 'contact-support',
    title: 'Contact Support',
    paragraphs: [
      'Need help or noticed suspicious activity? Logged-in students should use My Support Tickets to link the request to an account, listing, order, payment, report, or review. Public users can use Contact Support for signup, login, and account-access issues.',
    ],
    links: [
      { label: 'Contact Support', to: '/contact-support' },
      { label: 'Report a Problem', to: '/student/support/new' },
    ],
  },
];
