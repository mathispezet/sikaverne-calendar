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
        session.user.name = (user as any).displayName ?? user.name
      }
      return session
    },
    async signIn({ user, account, profile }) {
      if (profile && user.email) {
        await db.user.upsert({
          where: { email: user.email },
          update: {
            authentikId: profile.sub as string,
            displayName: (profile.name as string) ?? user.name ?? user.email,
            username: (profile.preferred_username as string) ?? user.email,
          },
          create: {
            email: user.email,
            displayName: (profile.name as string) ?? user.name ?? user.email,
            username: (profile.preferred_username as string) ?? user.email,
            authentikId: profile.sub as string,
          },
        })
      }
      return true
    },
  },
})