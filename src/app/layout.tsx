import type { Metadata } from "next";
import { Inter, Lora, Anek_Malayalam } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable:"--font-inter", subsets:["latin"] });
const lora = Lora({ variable:"--font-lora", subsets:["latin"] });
const anekMalayalam = Anek_Malayalam({ variable:"--font-anek-malayalam", subsets:["malayalam"] });

export const metadata: Metadata = {
  title:{ default:"All Kerala Islamic Fest", template:"%s | Islamic Fest" },
  description:"Registration and programme portal for All Kerala Islamic Fest.",
};

export default function RootLayout({ children }:{ children:React.ReactNode }) {
  return <html lang="en" className={`${inter.variable} ${lora.variable} ${anekMalayalam.variable}`}><body>{children}</body></html>;
}
