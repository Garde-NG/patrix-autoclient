import { cn, initials } from "@/lib/utils";

const palette = ["bg-accent", "bg-purple", "bg-teal", "bg-success", "bg-warning", "bg-danger"];

function hue(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

export function Avatar({ name, seed, size = "md", className }: { name: string; seed?: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const dim = size === "sm" ? "size-7 text-[11px]" : size === "lg" ? "size-14 text-[20px]" : "size-9 text-[13px]";
  return (
    <span className={cn("inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white", dim, hue(seed ?? name), className)} aria-hidden>
      {initials(name) || "?"}
    </span>
  );
}
