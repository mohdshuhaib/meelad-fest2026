import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable:"--font-inter", subsets:["latin"] });
const lora = Lora({ variable:"--font-lora", subsets:["latin"] });

export const metadata: Metadata = {
  title:{ default:"Ahlu Saada Meelad Fest", template:"%s | Ahlu Saada Meelad Fest" },
  description:"Registration and programme portal for Ahlu Saada Meelad Fest.",
};

export default function RootLayout({ children }:{ children:React.ReactNode }) {
  return <html lang="en" className={`${inter.variable} ${lora.variable}`}><body>{children}</body></html>;
}
