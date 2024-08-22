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
	},
	debug: false,
    callbacks: {
        async signIn({ account, profile}) {
            if (account?.provider === "google") {
                const allowedEmails = ["sujalchouhan77@gmail.com", "cyberghostx77@gmail.com", "amitabh.bhatia@gmail.com", "jitenpuri@gmail.com", "anushae.hassan@gmail.com", "ulkeshak23@gmail.com", "heenabanka@gmail.com"]

                return allowedEmails.includes(profile?.email || "");
            }
            return true
        }
    }
}
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
