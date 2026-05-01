// Domains that should never be indexed
export const EXCLUDED_DOMAINS = new Set([
  "accounts.google.com",
  "login.microsoftonline.com",
  "auth0.com",
  "paypal.com",
  "stripe.com",
  "chase.com",
  "bankofamerica.com",
  "wellsfargo.com",
  "localhost",
  "127.0.0.1",
]);

export const MAX_PAGES = 5000;

export const MAX_RECENT_SHOWN_PAGES_LIMIT = 20;
