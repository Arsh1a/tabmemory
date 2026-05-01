// Tracking query params that carry no page identity — always safe to strip
const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "utm_id",
  "utm_referrer",
  "fbclid",
  "gclid",
  "gclsrc",
  "dclid",
  "gbraid",
  "wbraid",
  "msclkid",
  "tclid",
  "ttclid",
  "mc_eid",
  "mc_cid",
  "igshid",
  "s_kwcid",
  "ref",
  "referrer",
]);

export function normalizeUrl(raw: string): string {
  try {
    const url = new URL(raw);
    url.hash = "";

    // Strip known tracking params while leaving meaningful ones (e.g. ?v=, ?q=, ?id=)
    for (const key of [...url.searchParams.keys()]) {
      if (TRACKING_PARAMS.has(key)) url.searchParams.delete(key);
    }

    // Remove trailing slash for consistency
    url.pathname = url.pathname.replace(/\/$/, "") || "/";

    return url.toString();
  } catch {
    return raw;
  }
}
