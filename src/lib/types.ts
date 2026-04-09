
export interface Package {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: string;
  imageUrl: string;
  includes?: string[];
  customItems?: { name: string; price: number }[];
  selectedAddons?: { id: string; name: string; price: number }[];
}

export interface Testimonial {
  id: string;
  text: string;
  author: string;
  rating: number;
}

export interface Stat {
  label: string;
  value: string;
}

export interface NavLink {
  label: string;
  href: string;
}
