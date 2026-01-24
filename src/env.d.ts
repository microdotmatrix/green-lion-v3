/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly DATABASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/// <reference path="../.astro/types.d.ts" />

declare namespace App {
  type AuthSession = typeof import("@/lib/auth").auth.$Infer.Session;
  type AuthUser = AuthSession["user"];

  interface Locals {
    user: AuthUser | null;
    session: AuthSession | null;
  }
}
