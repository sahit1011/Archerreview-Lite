import CredentialsProvider from 'next-auth/providers/credentials';
import { JWT } from 'next-auth/jwt';
import { Session, SessionStrategy, User as NextAuthUser, DefaultSession } from 'next-auth';
import { AuthOptions } from 'next-auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';

// Extend the built-in session types
declare module 'next-auth' {
  interface Session {
    user?: {
      id?: string;
    } & DefaultSession['user'];
  }
}

// Define a custom user type for our app
interface AppUser {
  id: string;
  email: string;
  name: string;
}

// Extend the built-in JWT types
declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
  }
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        await dbConnect();

        const user = await User.findOne({ email: credentials.email.toLowerCase() });
        if (!user) {
          return null;
        }

        const isValid = await user.comparePassword(credentials.password);
        if (!isValid) {
          return null;
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name
        };
      }
    })
  ],
  session: {
    strategy: 'jwt' as SessionStrategy,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  secret: process.env.JWT_SECRET || 'your-secret-key',
};
