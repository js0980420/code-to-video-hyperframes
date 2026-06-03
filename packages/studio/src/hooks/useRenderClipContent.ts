import { useCallback, type ReactNode } from "react";
import { createElement } from "react";
import { VideoThumbnail } from "../player";
import type { TimelineElement } from "../player";
import { AudioWaveform } from "../player/components/AudioWaveform";
import { getTimelineElementLabel } from "../utils/studioHelpers";

interface UseRenderClipContentOptions {
  projectIdRef: { current: string | null };
  compIdToSrc: Map<string, string>;
  activePreviewUrl: string | null;
  effectiveTimelineDuration: number;
}

const AUDIO_ASSET_EXTENSION = /\.(?:aac|aiff?|flac|m4a|mp3|oga|ogg|opus|wav|weba)(?:[?#].*)?$/i;
const VISUAL_ASSET_EXTENSION = /\.(?:avif|gif|jpe?g|png|svg|webp|mp4|mov|m4v|webm)(?:[?#].*)?$/i;

function isAudioAssetSrc(src: string | undefined): boolean {
  return Boolean(src && AUDIO_ASSET_EXTENSION.test(src));
}

function isVisualAssetSrc(src: string | undefined): boolean {
  return Boolean(src && VISUAL_ASSET_EXTENSION.test(src));
}

function renderClipPlaceholder(
  label: string,
  clipColor: string,
  labelColor: string,
  kind: "composition" | "html",
): ReactNode {
  const title = kind === "composition" ? "Composition" : "HTML Clip";
  return createElement(
    "div",
    {
      className: "absolute inset-0 overflow-hidden",
      "aria-hidden": true,
    },
    createElement("div", {
      className: "absolute inset-0",
      style: {
        background: `linear-gradient(135deg, ${clipColor}33 0%, rgba(15,23,42,0.18) 100%)`,
      },
    }),
    createElement("div", {
      className: "absolute inset-y-0 left-0 w-[3px]",
      style: { background: clipColor },
    }),
    createElement(
      "div",
      {
        className: "absolute inset-x-0 top-0 px-2 py-1",
        style: {
          background: "linear-gradient(180deg, rgba(15,23,42,0.55) 0%, rgba(15,23,42,0.12) 100%)",
        },
      },
      createElement(
        "span",
        {
          className:
            "block truncate text-[9px] font-semibold uppercase leading-none tracking-[0.12em]",
          style: { color: labelColor, opacity: 0.85 },
        },
        title,
      ),
      createElement(
        "span",
        {
          className: "mt-1 block truncate text-[10px] font-semibold leading-tight",
          style: { color: labelColor },
        },
        label,
      ),
    ),
  );
}

export function useRenderClipContent({
  projectIdRef,
  compIdToSrc,
  activePreviewUrl,
  effectiveTimelineDuration,
}: UseRenderClipContentOptions) {
  return useCallback(
    (el: TimelineElement, style: { clip: string; label: string }): ReactNode => {
      const pid = projectIdRef.current;
      if (!pid) return null;

      // Resolve composition source path using the compIdToSrc map
      let compSrc = el.compositionSrc;
      if (compSrc && compIdToSrc.size > 0) {
        const resolved =
          compIdToSrc.get(el.id) ||
          compIdToSrc.get(compSrc.replace(/^compositions\//, "").replace(/\.html$/, ""));
        if (resolved) compSrc = resolved;
      }

      // Composition clips — always use the comp's own preview URL for thumbnails.
      // This renders the composition in isolation so we get clean frames
      // instead of capturing the master at a time when the comp is fading in.
      if (compSrc) {
        return renderClipPlaceholder(
          getTimelineElementLabel(el),
          style.clip,
          style.label,
          "composition",
        );
      }

      // Audio clips — waveform visualization.
      // Guard by extension because DOM fallback parsing can inherit nested media
      // metadata from visual wrappers; image URLs should never hit /waveform.
      if (el.tag === "audio" && isAudioAssetSrc(el.src)) {
        const previewBase = `/api/projects/${pid}/preview/`;
        const previewIdx = el.src?.startsWith("http") ? el.src.indexOf(previewBase) : -1;
        const srcRelative = el.src
          ? previewIdx !== -1
            ? decodeURIComponent(el.src.slice(previewIdx + previewBase.length))
            : el.src.startsWith("http")
              ? null
              : el.src
          : null;
        const audioUrl = srcRelative
          ? `/api/projects/${pid}/preview/${srcRelative}`
          : (el.src ?? "");
        const waveformUrl = srcRelative
          ? `/api/projects/${pid}/waveform/${srcRelative}`
          : undefined;
        return createElement(AudioWaveform, {
          audioUrl,
          waveformUrl,
          label: getTimelineElementLabel(el),
          labelColor: style.label,
        });
      }

      // When drilled into a composition, render inner visual elements via
      // CompositionThumbnail at their start time. Audio-only clips must stay on
      // the waveform path above because selector thumbnails expect visible DOM.
      if (activePreviewUrl && el.duration > 0) {
        return renderClipPlaceholder(getTimelineElementLabel(el), style.clip, style.label, "html");
      }

      const htmlPreviewEligible =
        el.duration > 0 &&
        effectiveTimelineDuration > 0 &&
        el.duration < effectiveTimelineDuration * 0.92 &&
        !/(backdrop|background|overlay|scrim|mask)/i.test(el.id);

      if ((el.tag === "video" || el.tag === "img" || isVisualAssetSrc(el.src)) && el.src) {
        const mediaSrc = el.src.startsWith("http")
          ? el.src
          : `/api/projects/${pid}/preview/${el.src}`;
        return createElement(VideoThumbnail, {
          videoSrc: mediaSrc,
          label: getTimelineElementLabel(el),
          labelColor: style.label,
          duration: el.duration,
        });
      }

      if (htmlPreviewEligible) {
        return renderClipPlaceholder(getTimelineElementLabel(el), style.clip, style.label, "html");
      }

      return null;
    },
    [projectIdRef, compIdToSrc, activePreviewUrl, effectiveTimelineDuration],
  );
}
