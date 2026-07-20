export type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  condition: 'New' | 'Like New' | 'Good' | 'Fair' | 'Used';
  seller: string;
  sellerTrust: number;
  sellerRating: number;
  college: string;
  location: string;
  posted: string;
  negotiable: boolean;
  visual:
    | 'books'
    | 'bicycle'
    | 'laptop'
    | 'furniture'
    | 'audio'
    | 'lab'
    | 'calculator'
    | 'hostel';
  accent:
    | 'cyan'
    | 'yellow'
    | 'blue'
    | 'rose'
    | 'violet'
    | 'green'
    | 'orange'
    | 'slate';
};

export const listings: Listing[] = [
  {
    id: 'engineering-mathematics-set',
    title: 'Engineering Mathematics book set',
    description:
      'Three well-kept semester books with highlighted formulas and a separate handwritten revision sheet.',
    price: 680,
    originalPrice: 1450,
    category: 'Books',
    condition: 'Good',
    seller: 'Priya Verma',
    sellerTrust: 84,
    sellerRating: 4.8,
    college: 'Rajkiya Engineering College, Bijnor',
    location: 'Academic Block',
    posted: '12 min ago',
    negotiable: true,
    visual: 'books',
    accent: 'yellow',
  },
  {
    id: 'btwin-campus-bicycle',
    title: 'Btwin campus bicycle',
    description:
      'Smooth seven-speed bicycle, recently serviced. Includes lock, bottle holder, and rear mudguard.',
    price: 4200,
    originalPrice: 7800,
    category: 'Bicycles',
    condition: 'Good',
    seller: 'Rahul Yadav',
    sellerTrust: 72,
    sellerRating: 4.6,
    college: 'Rajkiya Engineering College, Bijnor',
    location: 'Boys Hostel Gate',
    posted: '38 min ago',
    negotiable: true,
    visual: 'bicycle',
    accent: 'green',
  },
  {
    id: 'hp-laptop-i5',
    title: 'HP laptop, i5 11th Gen',
    description:
      '8 GB RAM, 512 GB SSD and charger included. Ideal for coding, assignments, and everyday use.',
    price: 28500,
    originalPrice: 51000,
    category: 'Electronics',
    condition: 'Like New',
    seller: 'Mohit Singh',
    sellerTrust: 93,
    sellerRating: 4.9,
    college: 'Rajkiya Engineering College, Bijnor',
    location: 'Library Entrance',
    posted: '1 hr ago',
    negotiable: false,
    visual: 'laptop',
    accent: 'blue',
  },
  {
    id: 'study-table-chair',
    title: 'Compact study table and chair',
    description:
      'Solid table with a lower shelf and a comfortable chair. Fits easily inside a hostel room.',
    price: 1800,
    originalPrice: 3200,
    category: 'Furniture',
    condition: 'Good',
    seller: 'Sana Khan',
    sellerTrust: 67,
    sellerRating: 4.5,
    college: 'Rajkiya Engineering College, Bijnor',
    location: 'Girls Hostel Reception',
    posted: '2 hrs ago',
    negotiable: true,
    visual: 'furniture',
    accent: 'rose',
  },
  {
    id: 'sony-headphones',
    title: 'Sony wireless headphones',
    description:
      'Clear audio with reliable battery backup. Comes with the charging cable and carrying pouch.',
    price: 1500,
    originalPrice: 2999,
    category: 'Electronics',
    condition: 'Like New',
    seller: 'Aditya Kumar',
    sellerTrust: 78,
    sellerRating: 4.7,
    college: 'Rajkiya Engineering College, Bijnor',
    location: 'Cafeteria',
    posted: 'Yesterday',
    negotiable: false,
    visual: 'audio',
    accent: 'violet',
  },
  {
    id: 'electronics-lab-kit',
    title: 'Basic electronics lab kit',
    description:
      'Breadboard, multimeter, jumper wires and component box for first- and second-year labs.',
    price: 950,
    originalPrice: 1800,
    category: 'Lab Equipment',
    condition: 'Good',
    seller: 'Naman Gupta',
    sellerTrust: 88,
    sellerRating: 4.8,
    college: 'Rajkiya Engineering College, Bijnor',
    location: 'Electrical Block',
    posted: 'Yesterday',
    negotiable: true,
    visual: 'lab',
    accent: 'cyan',
  },
  {
    id: 'casio-scientific-calculator',
    title: 'Casio scientific calculator',
    description:
      'Fully working calculator accepted for university exams. Name engraving is covered cleanly.',
    price: 520,
    originalPrice: 1100,
    category: 'Stationery',
    condition: 'Good',
    seller: 'Ishita Tiwari',
    sellerTrust: 61,
    sellerRating: 4.4,
    college: 'Rajkiya Engineering College, Bijnor',
    location: 'Main Gate',
    posted: '2 days ago',
    negotiable: false,
    visual: 'calculator',
    accent: 'orange',
  },
  {
    id: 'hostel-starter-bundle',
    title: 'Hostel starter bundle',
    description:
      'Bucket, extension board, desk lamp, hangers, and storage basket in one practical bundle.',
    price: 1100,
    originalPrice: 2100,
    category: 'Hostel Essentials',
    condition: 'Like New',
    seller: 'Kritika Joshi',
    sellerTrust: 76,
    sellerRating: 4.7,
    college: 'Rajkiya Engineering College, Bijnor',
    location: 'Hostel Common Room',
    posted: '3 days ago',
    negotiable: true,
    visual: 'hostel',
    accent: 'slate',
  },
];

export const categories = [
  'All categories',
  'Books',
  'Notes',
  'Electronics',
  'Bicycles',
  'Hostel Essentials',
  'Furniture',
  'Lab Equipment',
  'Stationery',
  'Clothing',
  'Others',
];

export const colleges = [
  {
    name: 'Rajkiya Engineering College, Bijnor',
    city: 'Bijnor',
    listings: 186,
    students: 742,
  },
  {
    name: 'Rajkiya Engineering College, Banda',
    city: 'Banda',
    listings: 142,
    students: 619,
  },
  {
    name: 'Rajkiya Engineering College, Kannauj',
    city: 'Kannauj',
    listings: 128,
    students: 584,
  },
  {
    name: 'Rajkiya Engineering College, Ambedkar Nagar',
    city: 'Ambedkar Nagar',
    listings: 117,
    students: 531,
  },
];

export type Order = {
  id: string;
  listing: Listing;
  role: 'Bought' | 'Sold';
  status:
    'PENDING_PAYMENT' | 'PAID' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED';
  date: string;
};

export const orders: Order[] = [
  {
    id: 'CH-240718',
    listing: listings[0],
    role: 'Bought',
    status: 'READY_FOR_PICKUP',
    date: '18 Jul 2026',
  },
  {
    id: 'CH-240703',
    listing: listings[4],
    role: 'Bought',
    status: 'COMPLETED',
    date: '03 Jul 2026',
  },
  {
    id: 'CH-240625',
    listing: listings[6],
    role: 'Sold',
    status: 'COMPLETED',
    date: '25 Jun 2026',
  },
  {
    id: 'CH-240621',
    listing: listings[7],
    role: 'Sold',
    status: 'PAID',
    date: '21 Jun 2026',
  },
];

export type CampusNotification = {
  id: number;
  title: string;
  body: string;
  time: string;
  type: 'order' | 'listing' | 'payment' | 'system';
  read: boolean;
};

export const initialNotifications: CampusNotification[] = [
  {
    id: 1,
    title: 'Your order is ready for pickup',
    body: 'Priya marked the Mathematics book set as ready at the Academic Block.',
    time: '8 min ago',
    type: 'order',
    read: false,
  },
  {
    id: 2,
    title: 'New interest in your listing',
    body: 'A student saved your scientific calculator listing.',
    time: '42 min ago',
    type: 'listing',
    read: false,
  },
  {
    id: 3,
    title: 'Payment confirmed',
    body: 'Payment for order CH-240718 was verified successfully.',
    time: 'Yesterday',
    type: 'payment',
    read: true,
  },
  {
    id: 4,
    title: 'Safety reminder',
    body: 'Meet inside campus and inspect the item before confirming handover.',
    time: '2 days ago',
    type: 'system',
    read: true,
  },
];
