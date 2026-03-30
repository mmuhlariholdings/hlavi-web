import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    githubLogin?: string;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "repo workflow read:user user:email",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      if (profile) {
        // GitHub profile includes `login` (the @username handle)
        token.githubLogin = (profile as Record<string, unknown>).login as string;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.githubLogin = token.githubLogin as string | undefined;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
