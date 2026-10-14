import { CARD_ALT, CARD_SIZE, renderSocialCard } from "@/lib/social-card";

export const runtime = "nodejs";
export const alt = CARD_ALT;
export const size = CARD_SIZE;
export const contentType = "image/png";

export default function TwitterImage() {
  return renderSocialCard();
}
