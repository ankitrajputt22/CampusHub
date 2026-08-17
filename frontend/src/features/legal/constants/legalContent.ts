/**
 * Product-level legal draft for development. A qualified legal professional
 * must review and approve the final content before Campus Hub launches.
 */

export const LEGAL_LAST_UPDATED = '08 August 2026';

export type LegalSectionContent = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export type LegalDocumentContent = {
  title: string;
  subtitle: string;
  metaDescription: string;
  sections: LegalSectionContent[];
};

export const privacyPolicy: LegalDocumentContent = {
  title: 'Privacy Policy',
  subtitle:
    'Learn how Campus Hub collects, uses, and protects your information.',
  metaDescription:
    'Learn how Campus Hub collects, uses, and protects user information.',
  sections: [
    {
      id: 'introduction',
      title: 'Introduction',
      paragraphs: [
        'Campus Hub is a verified college marketplace that helps students discover, buy, sell, review, and manage items within academic communities. This policy explains the information we handle when you create an account or use our marketplace, payment, safety, and support features.',
        'By using Campus Hub, you acknowledge the practices described in this policy. Campus Hub does not sell your personal information.',
      ],
    },
    {
      id: 'information-we-collect',
      title: 'Information We Collect',
      paragraphs: [
        'We collect information you provide, activity created through the platform, and limited technical information needed to keep accounts and transactions secure.',
      ],
      bullets: [
        'Full name, username, email address, phone number, and profile photo when uploaded.',
        'Selected college, department or branch, course, year of study, and hostel or campus area when provided.',
        'Listings, wishlist activity, orders, payment metadata, reviews, ratings, reports, support tickets, and notifications.',
        'Login, session, device, and security metadata used for authentication, fraud prevention, and troubleshooting.',
      ],
    },
    {
      id: 'account-profile',
      title: 'Account and Profile Information',
      paragraphs: [
        'Account information is used to create your Campus Hub identity, secure access, display the appropriate profile details, and allow other verified students to understand who they are dealing with.',
        'You are responsible for keeping your information accurate. Passwords are stored only in protected hashed form, and you should never send a password or OTP through a listing, report, or support ticket.',
      ],
    },
    {
      id: 'college-campus',
      title: 'College and Campus Information',
      paragraphs: [
        'Your selected college and related academic details help Campus Hub verify eligibility and place you in the correct campus marketplace. We may compare a college email domain with the selected institution where college-email verification is available.',
        'Hostel or campus area is private by default. It should be shared only when needed to coordinate an order or safe campus pickup.',
      ],
    },
    {
      id: 'marketplace-activity',
      title: 'Marketplace Activity',
      paragraphs: [
        'We process the listings you create, listing images, prices, item condition, pickup details, searches, wishlist activity, and marketplace interactions to provide discovery, selling, and safety features.',
        'Listing information intended for buyers may be visible to eligible Campus Hub users and may remain in moderation or transaction records after a listing becomes inactive.',
      ],
    },
    {
      id: 'orders-payments',
      title: 'Orders and Payments',
      paragraphs: [
        'Campus Hub stores order references, amounts, payment status, gateway order ID, payment ID, refund status, and related metadata as needed to reconcile and support transactions.',
        'Campus Hub does not store full card details, UPI PINs, or online-banking credentials. Payments are processed by Razorpay or another configured payment gateway, and a payment is treated as successful only after backend verification or a verified gateway event.',
      ],
    },
    {
      id: 'reviews-reports-support',
      title: 'Reviews, Reports, and Support Tickets',
      paragraphs: [
        'We retain reviews and ratings to support marketplace trust. Reports, supporting evidence, moderation decisions, support ticket messages, attachments, and status history may be retained to investigate concerns, enforce platform rules, and respond to requests.',
        'Internal moderation notes are restricted to authorized administrators and are not displayed on public profiles.',
      ],
    },
    {
      id: 'notifications',
      title: 'Notifications',
      paragraphs: [
        'Campus Hub creates notifications about orders, payments, listings, reviews, reports, support tickets, account security, and other relevant activity. Notification records can include whether and when a notification was read.',
        'Where preference controls are available, you can choose which optional notification channels to use. Essential account and safety messages may still be delivered.',
      ],
    },
    {
      id: 'how-we-use',
      title: 'How We Use Information',
      paragraphs: ['We use information to:'],
      bullets: [
        'Create and verify accounts and provide the correct college marketplace.',
        'Operate listings, wishlists, orders, payments, reviews, reports, notifications, and support.',
        'Protect users, prevent fraud, investigate misuse, and enforce platform rules.',
        'Troubleshoot errors, understand service performance, and improve Campus Hub.',
        'Meet legal, accounting, security, and dispute-handling obligations where applicable.',
      ],
    },
    {
      id: 'how-we-share',
      title: 'How We Share Information',
      paragraphs: [
        'We share information only as needed to operate Campus Hub—for example, with another party to an order, authorized administrators, infrastructure providers, or the configured payment gateway. Service providers are expected to handle information only for the agreed service purpose.',
        'We may disclose information where required by law, to respond to a valid legal process, or to protect users, Campus Hub, and the public from fraud, abuse, or safety threats. Campus Hub does not sell personal information.',
      ],
    },
    {
      id: 'public-profile-controls',
      title: 'Public Profile and Privacy Controls',
      paragraphs: [
        'Seller profiles always show the full name, college name, verified badge, Campus Trust Score, seller rating, total reviews, and active listings so that marketplace participants can make informed decisions.',
        'You can control the visibility of your bio, LinkedIn URL, GitHub URL, hostel or campus area, department or branch, and year of study through available profile privacy controls. Some order participants may receive limited pickup information when required to complete a transaction.',
      ],
    },
    {
      id: 'data-security',
      title: 'Data Security',
      paragraphs: [
        'Campus Hub uses access controls, password hashing, signed authentication tokens, server-side authorization, input validation, and other technical safeguards appropriate to the service. Access to administrative and moderation features is limited by role.',
        'No online system is completely risk-free. Keep your password secure, do not share OTPs, and contact support promptly if you suspect unauthorized account activity.',
      ],
    },
    {
      id: 'data-retention',
      title: 'Data Retention',
      paragraphs: [
        'We retain information while your account is active and for as long as reasonably needed to provide the service, resolve disputes, prevent abuse, maintain transaction and moderation history, and comply with legal or accounting obligations.',
        'Different records may have different retention periods. Deactivating an account does not automatically remove order, payment, review, report, audit, or safety records that Campus Hub must retain.',
      ],
    },
    {
      id: 'user-choices',
      title: 'User Choices and Controls',
      paragraphs: [
        'You may update eligible profile fields, manage profile visibility, review notifications, change your password, revoke active sessions, and request account deactivation through Campus Hub controls.',
        'For privacy questions, correction requests, or requests not available in your settings, contact Campus Hub Support. A request may require identity verification before changes are made.',
      ],
    },
    {
      id: 'account-deactivation',
      title: 'Account Deactivation',
      paragraphs: [
        'You can submit an account deactivation request from Account Settings. Campus Hub may first review active listings, pending orders, payment issues, reports, or safety concerns connected to the account.',
        'After deactivation, access can be restricted while necessary transaction, moderation, and legal records remain protected in accordance with the retention practices above.',
      ],
    },
    {
      id: 'eligibility',
      title: 'Children and Eligibility',
      paragraphs: [
        'Campus Hub is intended for eligible students and other users who can lawfully create an account and agree to these policies. Users must provide accurate age and student information where requested.',
        'If you are not legally able to agree to platform terms in your location, you should not create or use a Campus Hub account without the authorization required by applicable law.',
      ],
    },
    {
      id: 'changes',
      title: 'Changes to This Policy',
      paragraphs: [
        'We may update this policy when Campus Hub features, privacy controls, security practices, or legal requirements change. The updated date at the top of this page identifies the current draft.',
        'Where a change materially affects users, Campus Hub may provide an in-app notice or request renewed acceptance when appropriate.',
      ],
    },
    {
      id: 'contact',
      title: 'Contact Support',
      paragraphs: [
        'For privacy questions, account-related requests, or concerns about how your information is handled, contact Campus Hub Support. Logged-in students can use their support workspace to track replies securely.',
      ],
    },
  ],
};

export const termsAndConditions: LegalDocumentContent = {
  title: 'Terms and Conditions',
  subtitle: 'Please read these terms carefully before using Campus Hub.',
  metaDescription: 'Read the terms and rules for using Campus Hub.',
  sections: [
    {
      id: 'introduction',
      title: 'Introduction',
      paragraphs: [
        'These Terms and Conditions govern access to Campus Hub and its verified college marketplace, listings, orders, payments, reviews, reports, moderation, notifications, and support features.',
        'Campus Hub provides the platform and safety tools for student transactions; buyers and sellers remain responsible for their conduct, item descriptions, decisions, and campus handovers.',
      ],
    },
    {
      id: 'acceptance',
      title: 'Acceptance of Terms',
      paragraphs: [
        'By creating an account, accessing Campus Hub, or using any platform feature, you agree to follow these terms, the Privacy Policy, Refund Policy, and applicable Campus Hub rules.',
        'If you do not agree, do not create an account or continue using the platform.',
      ],
    },
    {
      id: 'eligibility',
      title: 'Eligibility',
      paragraphs: [
        'You must be eligible to use Campus Hub, provide accurate information, and be legally able to agree to these terms. Campus Hub may require college, email, phone, or other verification.',
        'Do not create fake accounts, impersonate another person, misrepresent your college, or use information that you are not authorized to provide.',
      ],
    },
    {
      id: 'account-registration',
      title: 'Account Registration',
      paragraphs: [
        'Registration information must be current, complete, and accurate. You are responsible for activity performed through your account and for keeping your password secure.',
        'Never share passwords or OTPs. Notify support promptly if you believe another person has accessed your account.',
      ],
    },
    {
      id: 'username-email-verification',
      title: 'Username, Email, and Verification',
      paragraphs: [
        'Your username must follow platform rules and must not impersonate others, contain abusive content, or mislead the community. Email addresses must be valid and unique.',
        'Campus Hub may verify email, phone, and student or college information before enabling access or sensitive actions. Attempts to bypass verification are prohibited.',
      ],
    },
    {
      id: 'student-college-information',
      title: 'Student and College Information',
      paragraphs: [
        'Your selected college or campus, department, course, and year of study should be accurate. Campus Hub may correct, restrict, or review accounts with inconsistent or unverifiable details.',
        'Access to a college marketplace does not grant permission to enter restricted physical campus areas or violate institutional rules.',
      ],
    },
    {
      id: 'marketplace-use',
      title: 'Marketplace Use',
      paragraphs: [
        'Eligible users can browse listings, create listings, wishlist items, place orders, complete supported payments, review completed transactions, and report suspicious activity.',
        'You must use these features honestly and only for lawful student-marketplace purposes. Fake listings, scam attempts, spam, misleading images, duplicate false reports, fake reviews, harassment, and attempts to bypass safety or payment rules are prohibited.',
      ],
    },
    {
      id: 'seller-responsibilities',
      title: 'Seller Responsibilities',
      paragraphs: ['Sellers must:'],
      bullets: [
        'Provide an accurate title, description, condition, price, images, and pickup location.',
        'Have the right to sell the item and disclose relevant damage, defects, and included parts.',
        'Not list fake, stolen, illegal, unsafe, counterfeit, recalled, or prohibited items.',
        'Mark an item sold or inactive when it is no longer available.',
        'Coordinate pickup honestly and complete order actions only when they are true.',
      ],
    },
    {
      id: 'buyer-responsibilities',
      title: 'Buyer Responsibilities',
      paragraphs: ['Buyers must:'],
      bullets: [
        'Review the listing, condition, price, and pickup details before purchasing.',
        'Inspect the item and included parts before confirming pickup when reasonably possible.',
        'Confirm pickup only after receiving the item.',
        'Not misuse payment, report, review, refund, or support systems.',
        'Communicate respectfully and not threaten, pressure, or harass sellers.',
      ],
    },
    {
      id: 'prohibited-items',
      title: 'Prohibited Items',
      paragraphs: [
        'Do not list items that are illegal, stolen, unsafe, counterfeit, dangerous, restricted by law or college rules, or otherwise prohibited by Campus Hub. Examples may include weapons, controlled substances, stolen academic material, fraudulent documents, or items that create a serious safety risk.',
        'Campus Hub may remove, block, or place a listing under review and may restrict the associated account without completing a transaction.',
      ],
    },
    {
      id: 'pricing-negotiation',
      title: 'Pricing and Negotiation',
      paragraphs: [
        'Sellers are responsible for setting honest prices. Buyers and sellers may negotiate respectfully where the platform allows, but neither party may use misleading charges, hidden fees, coercion, or off-platform arrangements to bypass supported safety and payment controls.',
        'Campus Hub does not guarantee an item’s market value or that a negotiation will result in a completed order.',
      ],
    },
    {
      id: 'orders-payments',
      title: 'Orders and Payments',
      paragraphs: [
        'Orders and payments must follow the statuses and actions provided by Campus Hub. A frontend success message, screenshot, or verbal claim is not proof of payment; paid status must come from backend verification or a verified payment-gateway event.',
        'Do not share OTPs, UPI PINs, card details, or passwords. Payment failures, duplicates, cancellation questions, and refund requests are handled according to the Refund Policy and available support process.',
      ],
    },
    {
      id: 'reviews-ratings',
      title: 'Reviews and Ratings',
      paragraphs: [
        'Reviews should describe a genuine completed transaction and must be truthful, relevant, and respectful. Fake, retaliatory, abusive, manipulated, or unrelated reviews may be hidden or removed.',
        'Ratings and Campus Trust Score signals assist marketplace decisions but are not guarantees about a person or item.',
      ],
    },
    {
      id: 'reports-moderation',
      title: 'Reports and Moderation',
      paragraphs: [
        'Campus Hub may review reports, evidence, listings, reviews, orders, support tickets, and account activity to investigate suspected violations. Authorized administrators may mark listings under review, block listings, hide reviews, resolve or reject reports, and warn, suspend, or block users.',
        'Moderation actions should be recorded in platform history or audit logs. Submitting knowingly false, abusive, or repetitive reports is itself a violation.',
      ],
    },
    {
      id: 'suspension-blocking',
      title: 'Account Suspension or Blocking',
      paragraphs: [
        'Campus Hub may warn, restrict, suspend, deactivate, or block an account that violates these terms, threatens users, creates fraud or safety risk, interferes with the platform, or repeatedly misuses marketplace features.',
        'Normal student accounts cannot access administrator routes or APIs. Attempts to obtain unauthorized administrative access may result in immediate restriction and further action.',
      ],
    },
    {
      id: 'intellectual-property',
      title: 'Intellectual Property',
      paragraphs: [
        'Campus Hub’s name, branding, interface, software, and original platform content are protected by applicable intellectual-property laws. You may not copy, reverse engineer, resell, or misuse them except where law expressly allows.',
        'You retain responsibility for content you upload and confirm that you have permission to use it. You grant Campus Hub the limited rights needed to host, display, process, and moderate that content for platform operation.',
      ],
    },
    {
      id: 'platform-availability',
      title: 'Platform Availability',
      paragraphs: [
        'Campus Hub may change, suspend, maintain, or discontinue features. Service can occasionally be unavailable because of maintenance, network issues, third-party services, security events, or other causes.',
        'We aim to provide a reliable service but do not promise uninterrupted or error-free availability.',
      ],
    },
    {
      id: 'limitation-responsibility',
      title: 'Limitation of Responsibility',
      paragraphs: [
        'Campus Hub provides marketplace, verification, payment-integration, reporting, and support tools. It does not manufacture, own, inspect, or guarantee every listed item and is not a substitute for a buyer’s inspection or a seller’s truthful disclosure.',
        'To the extent permitted by applicable law, Campus Hub is not responsible for indirect losses, off-platform payments, unsafe meetings arranged outside platform guidance, or user conduct beyond its reasonable control. Nothing in these terms excludes rights that cannot legally be excluded.',
      ],
    },
    {
      id: 'changes',
      title: 'Changes to Terms',
      paragraphs: [
        'We may update these terms when Campus Hub features, safety practices, payment flows, or legal requirements change. The last-updated date identifies the current draft.',
        'Continued use after an effective update may indicate acceptance where permitted, and Campus Hub may request renewed acceptance for material changes.',
      ],
    },
    {
      id: 'contact',
      title: 'Contact Support',
      paragraphs: [
        'Contact Campus Hub Support if you have a question about these terms, believe your account or listing was affected in error, or need help reporting a marketplace concern. Logged-in students can track the request through their support workspace.',
      ],
    },
  ],
};

export const refundPolicy: LegalDocumentContent = {
  title: 'Refund Policy',
  subtitle:
    'Understand how Campus Hub handles payment issues and refund requests.',
  metaDescription:
    'Understand how Campus Hub handles payment issues and refund requests.',
  sections: [
    {
      id: 'introduction',
      title: 'Introduction',
      paragraphs: [
        'This policy explains how payment failures, duplicate payments, cancellation-related concerns, and refund requests are reviewed for Campus Hub marketplace orders.',
        'For version 1, refund requests are handled through support tickets and authorized administrative review. Campus Hub does not promise an automatic refund merely because a request is submitted.',
      ],
    },
    {
      id: 'payment-processing',
      title: 'Payment Processing',
      paragraphs: [
        'Payments are processed by Razorpay or another configured payment gateway. Campus Hub must verify the payment through its backend before an order is marked paid; a frontend success screen alone is never trusted.',
        'Campus Hub stores limited references and status metadata needed to reconcile orders and payments, not full card details, UPI PINs, or online-banking credentials.',
      ],
    },
    {
      id: 'refund-consideration',
      title: 'When Refunds May Be Considered',
      paragraphs: ['A refund may be considered after verification for:'],
      bullets: [
        'A duplicate payment for the same order.',
        'Payment deducted but the order was not confirmed after gateway reconciliation.',
        'A seller being unable to provide the item after a successful payment.',
        'An eligible order cancelled before completion.',
        'Another verified payment or order issue approved after support or admin review.',
      ],
    },
    {
      id: 'failed-payments',
      title: 'Failed Payments',
      paragraphs: [
        'If payment fails, the order should remain Pending Payment or Payment Failed. A buyer may retry when the order and listing are still eligible and the platform offers a retry action.',
        'A bank debit notification does not by itself prove that Campus Hub received a successful payment. Gateway reconciliation may be required before the next action is determined.',
      ],
    },
    {
      id: 'duplicate-payments',
      title: 'Duplicate Payments',
      paragraphs: [
        'If you believe the same order was charged more than once, do not attempt repeated payments. Create a Payment Issue support ticket and provide the order number, approximate time, amount, and safe payment reference information.',
        'Support or an authorized administrator will compare Campus Hub records with verified gateway records before deciding the appropriate correction or refund path.',
      ],
    },
    {
      id: 'cancelled-before-payment',
      title: 'Order Cancelled Before Payment Completion',
      paragraphs: [
        'An unpaid order can generally be cancelled without a refund because no verified payment was received. If a payment was processing while cancellation occurred, Campus Hub must first reconcile the final gateway status.',
        'Where policy and order status allow, a verified payment connected to a properly cancelled order may be reviewed for refund.',
      ],
    },
    {
      id: 'item-not-received',
      title: 'Item Not Received or Seller Issue',
      paragraphs: [
        'If a seller cannot provide the item after successful payment, the buyer should not confirm pickup and should promptly create a support ticket linked to the order.',
        'Campus Hub may review the order, payment, seller actions, support messages, and available evidence before determining whether a refund or another resolution is appropriate.',
      ],
    },
    {
      id: 'different-description',
      title: 'Item Different From Description',
      paragraphs: [
        'Buyers should inspect an item before confirming pickup. If the item is materially different from its listing, stop the handover where safe, preserve relevant evidence, and report the issue through support.',
        'A claim does not guarantee a refund. Support and moderation may consider the listing, disclosed condition, order status, pickup confirmation, communication, and evidence from both parties.',
      ],
    },
    {
      id: 'non-refundable',
      title: 'Non-refundable Situations',
      paragraphs: ['A refund may be unavailable where:'],
      bullets: [
        'The buyer changed their mind after successful pickup.',
        'The buyer confirmed pickup and the order was completed without a verified issue.',
        'The request is false, abusive, unsupported, or connected to a platform-rule violation.',
        'Payment was made directly outside Campus Hub.',
        'The issue was not reported within an applicable support window announced by Campus Hub.',
      ],
    },
    {
      id: 'review-process',
      title: 'Refund Review Process',
      paragraphs: [
        'Submit a support ticket using the Payment Issue category and link the relevant order or payment where possible. Include a clear description and safe supporting evidence, but never share a password, OTP, UPI PIN, or full card number.',
        'Support verifies the account, order, backend payment status, gateway references, and relevant transaction history. Additional information may be requested before a decision is made.',
      ],
    },
    {
      id: 'refund-timeline',
      title: 'Refund Timeline',
      paragraphs: [
        'Review time depends on the issue and the availability of verified gateway and order records. If a refund is approved and initiated, the payment gateway, bank, card network, or UPI provider controls the final processing time.',
        'Campus Hub will communicate the available status through support or payment records. Estimated timelines are not a guarantee when processing depends on external financial institutions.',
      ],
    },
    {
      id: 'support-tickets',
      title: 'Support Tickets for Refunds',
      paragraphs: [
        'For version 1, support tickets are the official path for refund requests. Logged-in users should use My Support Tickets so the request can be linked securely to their order or payment and tracked through replies.',
        'Users who cannot access their account may use the public contact-support form. Duplicate requests can slow investigation, so keep updates in the original ticket whenever possible.',
      ],
    },
    {
      id: 'admin-review',
      title: 'Admin Review',
      paragraphs: [
        'Authorized administrators may review the support ticket, order, payment, gateway references, reports, and account history needed to decide the request. Administrative actions should be recorded for accountability.',
        'An administrator must not manually mark a payment successful. Successful status must come from backend verification or a verified payment webhook or gateway event.',
      ],
    },
    {
      id: 'changes',
      title: 'Changes to Refund Policy',
      paragraphs: [
        'Campus Hub may update this policy when payment providers, order flows, refund capabilities, support processes, or legal requirements change. The last-updated date identifies the current draft.',
        'A policy update does not convert an unsupported or off-platform payment into an eligible Campus Hub transaction.',
      ],
    },
    {
      id: 'contact',
      title: 'Contact Support',
      paragraphs: [
        'If payment was deducted but your order was not updated, you see a duplicate charge, or a seller cannot complete a paid order, contact Campus Hub Support. Use the logged-in support workspace whenever possible so the request can be linked to the correct order or payment.',
      ],
    },
  ],
};
