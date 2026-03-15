
import { Package, Testimonial, Stat } from './types';

export const SEARCH_SUGGESTIONS = [
  { name: "Full Blood Count", price: "NGN4,000,000" },
  { name: "Full Thyroid Panel", price: "NGN4,000,000" },
  { name: "Full Electrolyte Panel", price: "NGN4,000,000" },
  { name: "Lipid Profile", price: "NGN3,500,000" },
  { name: "Malaria Parasite Test", price: "NGN2,000,000" },
  { name: "Liver Function Test", price: "NGN4,500,000" }
];

export const CATEGORIES = [
  "Male Wellness",
  "Female Wellness",
  "Custom Package",
  "Fertility",
  "Elderly Wellness",
  "Cancer Screening",
  "Premarital Screening",
  "Cardiac Health",
  "Diabetes Screening",
  "Thyroid Function",
  "Kidney Function",
  "Liver Function",
  "Hormonal Balance",
  "Infectious Diseases",
  "Allergy Testing",
  "Vitamin Deficiency",
  "Sexual Health",
  "Genomic Testing"
];

export const PACKAGES: Package[] = [
  {
    id: '1',
    slug: 'female-wellness-screening',
    title: "Female Wellness Screening",
    description: "Proactive laboratory tests tailored to women—helping you understand your health, detect risks early, and take informed action.",
    price: "NGN1,000,000",
    imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800",
    includes: [
      "Consultation",
      "Liver Function Test (ALT,AST,GGT, Bilirubin, ALP,Total Proteins, Albumin, Globulin)",
      "Detailed medical exam including weight, height, BMI",
      "Chest X-Ray",
      "Urinalysis",
      "Virology",
      "Renal function Tests (Electrolytes, Urea, Creatinine)",
      "PCV"
    ]
  },
  {
    id: '2',
    slug: 'male-wellness-screening',
    title: "Male Wellness Screening",
    description: "Comprehensive health check-up designed for men to monitor vital organ functions and detect early signs of health issues.",
    price: "NGN1,000,000",
    imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=800",
    includes: [
        "Consultation",
        "Liver Function Test",
        "Full Blood Count",
        "Prostate Specific Antigen (PSA)",
        "Kidney Function Test",
        "Chest X-Ray",
        "Urinalysis",
        "ECG"
    ]
  },
  {
    id: '3',
    slug: 'premarital-screening',
    title: "Premarital Screening",
    description: "Essential tests for couples planning to get married, ensuring a healthy start to your new life together.",
    price: "NGN500,000",
    imageUrl: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800",
    includes: [
        "Genotype",
        "Blood Group",
        "HIV Screening",
        "Hepatitis B & C",
        "Syphilis Screening",
        "Fertility Profile"
    ]
  },
  {
    id: '4',
    slug: 'cancer-screening-basic',
    title: "Cancer Screening (Basic)",
    description: "Screening tests to detect early signs of common cancers, enabling timely intervention and better outcomes.",
    price: "NGN1,200,000",
    imageUrl: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=800",
    includes: [
        "Tumor Markers (CEA, CA-125)",
        "Mammogram (Females)",
        "PSA (Males)",
        "Occult Blood",
        "Full Blood Count",
        "Consultation"
    ]
  },
  {
    id: '5',
    slug: 'elderly-care-package',
    title: "Elderly Care Package",
    description: "Tailored for seniors, this package monitors age-related health concerns to maintain quality of life.",
    price: "NGN850,000",
    imageUrl: "https://images.unsplash.com/photo-1581579186913-45ac3e6e3dd2?auto=format&fit=crop&q=80&w=800",
    includes: [
        "Bone Mineral Density",
        "Lipid Profile",
        "Blood Sugar (Fasting & PP)",
        "Kidney Function Test",
        "Liver Function Test",
        "ECG"
    ]
  },
  {
    id: '6',
    slug: 'full-body-checkup',
    title: "Full Body Checkup",
    description: "A complete assessment of your overall health status, covering all major systems and vital organs.",
    price: "NGN1,500,000",
    imageUrl: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&q=80&w=800",
    includes: [
        "Full Blood Count",
        "Lipid Profile",
        "Liver Function Test",
        "Kidney Function Test",
        "Thyroid Function Test",
        "Urine Analysis",
        "Chest X-Ray",
        "ECG"
    ]
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    text: "Your services have been marvelous. This screening helped me detect so many potential risks. Thank you Firmcare",
    author: "Olurombi A",
    rating: 5
  },
  {
    id: '2',
    text: "The professionalism shown by the staff was top-notch. I felt comfortable throughout the entire process.",
    author: "Sarah K",
    rating: 5
  },
  {
    id: '3',
    text: "Fast results and excellent customer support. I highly recommend their wellness packages.",
    author: "Michael T",
    rating: 5
  },
  {
    id: '4',
    text: "FirmCare made my premarital screening process seamless. Very reliable diagnostics.",
    author: "Chidinma O",
    rating: 5
  }
];

export const STATS: Stat[] = [
  { label: "Partners", value: "10+" },
  { label: "Happy Clients", value: "5000+" },
  { label: "Round the clock support", value: "24/7" },
];
