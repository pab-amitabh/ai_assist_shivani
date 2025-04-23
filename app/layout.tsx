import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Provider from "./context/AuthContext"

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PolicyAdvisor AI",
  description: "PolicyAdvisor AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
    <head>
        <link rel="icon" href="/policyAdvisorIcon.png" type="image/png" />
      </head>
      <body className={inter.className}>
        <Provider>
            {children}
        </Provider>
      </body>
    </html>
  );
}
