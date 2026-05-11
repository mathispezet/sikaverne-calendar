import NextAuth from "next-auth"
import Authentik from "next-auth/providers/authentik"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "@/lib/db"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  session: {
    strategy: "database",
  },
  providers: [
    Authentik({
      clientId: process.env.AUTH_AUTHENTIK_ID,
      clientSecret: process.env.AUTH_AUTHENTIK_SECRET,
      issuer: process.env.AUTH_AUTHENTIK_ISSUER,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { displayName: true },
        })
        const displayName = dbUser?.displayName?.trim()
        session.user.name = displayName || user.name || user.email
      }
      return session
    },
    async signIn({ user, account, profile }) {
      if (profile && user.email) {
        const displayName =
          (profile.name as string)?.trim() ||
          (profile.preferred_username as string)?.trim() ||
          user.name?.trim() ||
          user.email
        const username =
          (profile.preferred_username as string)?.trim() || user.email

        await db.user.upsert({
          where: { email: user.email },
          update: {
            authentikId: profile.sub as string,
            displayName,
            username,
          },
          create: {
            email: user.email,
            displayName,
            username,
            authentikId: profile.sub as string,
          },
        })
      }
      return true
    },
  },
})