import { cn } from "@/lib/utils";

/*
 * The brand assets in /public/images/logo are white-on-transparent. They are painted through a CSS
 * mask with the current text colour, so one file works on light and dark surfaces and stays crisp.
 */
const MARK = { src: "/images/logo/logo-collaspes.svg", w: 48, h: 54 };
const FULL = { src: "/images/logo/logo.svg", w: 153, h: 54 };

function Masked({ src, w, h, height, className, label }: { src: string; w: number; h: number; height: number; className?: string; label?: string }) {
  const width = Math.round((w / h) * height);
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("inline-block shrink-0 bg-current", className)}
      style={{
        width,
        height,
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}

/** Collapsed mark only. */
export function BrandMark({ className, size = 28 }: { className?: string; size?: number }) {
  return <Masked {...MARK} height={size} className={cn("text-text", className)} />;
}

/** Full logotype. */
export function Wordmark({ className, height = 28 }: { className?: string; height?: number }) {
  return <Masked {...FULL} height={height} label="Garde" className={cn("text-text", className)} />;
}
