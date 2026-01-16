import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { COOKIE_NAME } from "@shared/const";
import { jwtVerify } from "jose";
import { ENV } from "./env";
import * as db from "../db";
import { parse as parseCookieHeader } from "cookie";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

// Função para autenticar via JWT próprio (login com email/senha)
async function authenticateWithOwnJWT(cookieValue: string): Promise<User | null> {
  try {
    const secret = new TextEncoder().encode(ENV.jwtSecret);
    const { payload } = await jwtVerify(cookieValue, secret, {
      algorithms: ["HS256"],
    });
    
    const userId = payload.userId as number;
    if (!userId) return null;
    
    const user = await db.getUserById(userId);
    return user || null;
  } catch (error) {
    return null;
  }
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // Obter cookie de sessão
  const cookieHeader = opts.req.headers.cookie;
  const cookies = cookieHeader ? parseCookieHeader(cookieHeader) : {};
  const sessionCookie = cookies[COOKIE_NAME];

  if (sessionCookie) {
    // Primeiro, tentar autenticar via JWT próprio (login com email/senha)
    user = await authenticateWithOwnJWT(sessionCookie);
    
    // Se não funcionou, tentar via OAuth Manus
    if (!user) {
      try {
        user = await sdk.authenticateRequest(opts.req);
      } catch (error) {
        // Authentication is optional for public procedures.
        user = null;
      }
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
