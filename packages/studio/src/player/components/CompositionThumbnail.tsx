import { memo } from "react";

interface CompositionThumbnailProps {
  previewUrl: string;
  label: string;
  labelColor: string;
  accentColor?: string;
  selector?: string;
  selectorIndex?: number;
  seekTime?: number;
  duration?: number;
  width?: number;
  height?: number;
}

const THUMBNAIL_URL_VERSION = "v3";
export const COMPOSITION_THUMBNAIL_LABEL_Z_INDEX = 10;

export function buildCompositionThumbnailUrl({
  previewUrl,
  seekTime = 2,
  duration = 5,
  selector,
  selectorIndex,
  origin,
}: {
  previewUrl: string;
  seekTime?: number;
  duration?: number;
  selector?: string;
  selectorIndex?: number;
  origin: string;
}): string {
  const thumbnailBase = previewUrl
    .replace("/preview/comp/", "/thumbnail/")
    .replace(/\/preview$/, "/thumbnail/index.html");
  const midTime = seekTime + duration / 2;
  const thumbnailUrl = new URL(thumbnailBase, origin);
  thumbnailUrl.searchParams.set("t", midTime.toFixed(2));
  thumbnailUrl.searchParams.set("v", THUMBNAIL_URL_VERSION);
  if (selector) {
    thumbnailUrl.searchParams.set("selector", selector);
    if (selectorIndex != null && selectorIndex > 0) {
      thumbnailUrl.searchParams.set("selectorIndex", String(selectorIndex));
    }
  }
  return thumbnailUrl.toString();
}

export const CompositionThumbnail = memo(function CompositionThumbnail({
  label,
  labelColor,
  accentColor = "#6B7280",
  previewUrl: _previewUrl,
  selector: _selector,
  selectorIndex: _selectorIndex,
  seekTime: _seekTime = 2,
  duration: _duration = 5,
}: CompositionThumbnailProps) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(120deg, ${accentColor}2e, transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.08))`,
        }}
      />
      <div className="absolute inset-y-0 left-0 w-[3px]" style={{ background: accentColor }} />

      <div
        className="absolute left-2 top-2"
        style={{ zIndex: COMPOSITION_THUMBNAIL_LABEL_Z_INDEX }}
      >
        <span
          className="block max-w-full truncate rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase leading-none"
          style={{
            color: labelColor,
            background: `${accentColor}2e`,
            boxShadow: `inset 0 0 0 1px ${accentColor}40`,
          }}
        >
          Composition
        </span>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 px-1.5 pb-0.5 pt-3"
        style={{
          zIndex: COMPOSITION_THUMBNAIL_LABEL_Z_INDEX,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)",
        }}
      >
        <span
          className="block truncate text-[9px] font-semibold leading-tight"
          style={{ color: labelColor, textShadow: "0 1px 2px rgba(0,0,0,0.9)" }}
        >
          {label}
        </span>
      </div>
    </div>
  );
});
