import type { OTTPlatform } from "./types";

export const PLATFORM_DOMAINS: Record<OTTPlatform, readonly string[]> = {
  nfx: ["netflix.com"],
  dnp: ["disneyplus.com"],
  wav: ["wavve.com"],
  tvk: ["tving.com"],
} as const;

export interface JustWatchOffer {
  standardWebURL?: string;
  package?: {
    shortName?: string;
    clearName?: string;
  };
}

export interface OfferValidation {
  valid: boolean;
  reason?: string;
}

/** JustWatch offer가 요청한 OTT와 실제로 일치하는지 검증 */
export function validateOttOffer(
  platform: OTTPlatform,
  offer?: JustWatchOffer | null
): OfferValidation {
  if (!offer) {
    return { valid: false, reason: "no_offer" };
  }

  if (!offer.standardWebURL) {
    return { valid: false, reason: "no_deeplink" };
  }

  const pkg = offer.package?.shortName;
  if (!pkg) {
    return { valid: false, reason: "no_package" };
  }

  if (pkg !== platform) {
    return { valid: false, reason: `wrong_package:${pkg}` };
  }

  const url = offer.standardWebURL.toLowerCase();
  const domains = PLATFORM_DOMAINS[platform];
  if (!domains.some((d) => url.includes(d))) {
    return { valid: false, reason: "wrong_domain" };
  }

  return { valid: true };
}
