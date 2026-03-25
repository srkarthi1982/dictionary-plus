/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly ASTRO_DB_REMOTE_URL: string;
  readonly ASTRO_DB_APP_TOKEN: string;
  readonly ANSIVERSA_AUTH_SECRET: string;
  readonly ANSIVERSA_SESSION_SECRET: string;
  readonly ANSIVERSA_COOKIE_DOMAIN: string;
  readonly SESSION_COOKIE_NAME?: string;
  readonly PUBLIC_ROOT_APP_URL?: string;
  readonly ANSIVERSA_DASHBOARD_WEBHOOK_URL?: string;
  readonly ANSIVERSA_NOTIFICATIONS_WEBHOOK_URL?: string;
}

interface Window {
  Alpine: import("alpinejs").Alpine;
}

declare namespace App {
  interface Locals {
    user?: {
      id: string;
      email: string;
      name?: string;
      roleId?: string;
      stripeCustomerId?: string;
    };
    sessionToken?: string | null;
    isAuthenticated?: boolean;
    rootAppUrl?: string;
  }
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
