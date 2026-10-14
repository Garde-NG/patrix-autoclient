import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const CARD_SIZE = { width: 1200, height: 630 };
export const CARD_ALT = "AutoAPI by Garde: know before the APIs your code depends on break, with verified repairs delivered as pull requests.";

/**
 * The social card shared on WhatsApp, iMessage, Slack, LinkedIn, X and Facebook. Rendered once at
 * build time from the shield mark in public/favicon_manfest, sized 1200×630 and kept well under
 * WhatsApp's 300 KB preview limit (flat colours, no photos).
 */
export async function renderSocialCard(): Promise<ImageResponse> {
  const mark = await readFile(join(process.cwd(), "public", "favicon_manfest", "android-chrome-512x512.png"));
  const markSrc = `data:image/png;base64,${mark.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "linear-gradient(135deg, #0a0f1f 0%, #101a33 55%, #0b2a5c 100%)",
          color: "#f5f5f7",
          fontFamily: "Inter, -apple-system, Segoe UI, Roboto, sans-serif",
          position: "relative",
        }}
      >
        {/* Soft accent glow behind the mark */}
        <div
          style={{
            position: "absolute",
            right: -120,
            top: -140,
            width: 620,
            height: 620,
            borderRadius: 9999,
            background: "radial-gradient(circle, rgba(10,132,255,0.55) 0%, rgba(10,132,255,0.12) 45%, rgba(10,132,255,0) 70%)",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 112,
              height: 112,
              borderRadius: 30,
              background: "linear-gradient(160deg, #0a84ff 0%, #0056b3 100%)",
              boxShadow: "0 18px 50px rgba(10,132,255,0.35)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={markSrc} width={72} height={72} alt="" />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 56, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1 }}>AutoAPI</div>
            <div style={{ fontSize: 24, color: "#9fb4d6", marginTop: 10, letterSpacing: 0.2 }}>by Garde</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 980 }}>
          <div style={{ fontSize: 68, fontWeight: 700, letterSpacing: -2.2, lineHeight: 1.05 }}>Know before the APIs your code depends on break.</div>
          <div style={{ fontSize: 30, color: "#c3cfe3", lineHeight: 1.35 }}>
            Monitors third-party APIs, maps breaking changes to the exact lines that use them, and opens verified repair pull requests. Never merges on its own.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 24, color: "#9fb4d6" }}>
          <div style={{ width: 10, height: 10, borderRadius: 999, background: "#30db5b" }} />
          <div>Breaking changes caught · Code mapped · Fixes verified</div>
        </div>
      </div>
    ),
    { ...CARD_SIZE },
  );
}
