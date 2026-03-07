/// <reference path="../.astro/types.d.ts" />

declare namespace App {
  type AuthContext = typeof import("@/lib/auth").auth.$Infer.Session;
  type AuthUser = AuthContext["user"];
  type AuthSession = AuthContext["session"];

  interface Locals {
    user: AuthUser | null;
    session: AuthSession | null;
  }
}
