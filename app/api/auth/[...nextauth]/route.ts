import NextAuth from 'next-auth/next'
import GoogleProvider from "next-auth/providers/google";
import prisma from "../../../libs/prismadb";
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import type { NextAuthOptions } from 'next-auth';

const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ''
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 12 * 60 * 60, 
    updateAge: 0         
  },
  debug: false,
//   callbacks: {
//     async signIn({ account, profile }) {
//       if (account?.provider === "google") {
//         const allowedEmails = [
//           "amitabh.bhatia@gmail.com", "jitenpuri@gmail.com", "anushae.hassan@gmail.com",
//           "ulkeshak23@gmail.com", "heenabanka@gmail.com", "shivani.lpu71096@gmail.com",
//           "pollardryan525@gmail.com", "amitabh@policyadvisor.com", "jiten@policyadvisor.com",
//           "shivani@policyadvisor.com", "anushae@policyadvisor.com", "babita@policyadvisor.com",
//           "brandon@policyadvisor.com", "carly@policyadvisor.com", "colep@policyadvisor.com",
//           "diarmuid@policyadvisor.com", "harshmeet@policyadvisor.com", "heena@policyadvisor.com",
//           "hemin@policyadvisor.com", "jason@policyadvisor.com", "khaleel@policyadvisor.com",
//           "matthewc@policyadvisor.com", "merab@policyadvisor.com", "nikal@policyadvisor.com",
//           "parmeet@policyadvisor.com", "priyanka@policyadvisor.com", "reidc@policyadvisor.com",
//           "ripenjeet@policyadvisor.com", "ruchita@policyadvisor.com", "ryanp@policyadvisor.com",
//           "subir@policyadvisor.com", "ulkesha@policyadvisor.com", "vanessa@policyadvisor.com",
//           "visnu@policyadvisor.com","pankaj@policyadvisor.com","mayank@policyadvisor.com"
//         ];
//         return allowedEmails.includes(profile?.email || "");
//       }
//       return true;
//     }
//   }
    callbacks: {
        async signIn({ account, profile }) {
            if (account?.provider === "google") {
            const email = profile?.email || "";
            const allowedDomains = ["@policyadvisor.com"];
            const allowedEmails = [
                "amitabh.bhatia@gmail.com", "jitenpuri@gmail.com", "heenabanka@gmail.com", "shivani.lpu71096@gmail.com"
            ];

            const isAllowedDomain = allowedDomains.some(domain => email.endsWith(domain));
            const isAllowedEmail = allowedEmails.includes(email);

            return isAllowedDomain || isAllowedEmail;
            }
            return true;
        }
    }
}

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
