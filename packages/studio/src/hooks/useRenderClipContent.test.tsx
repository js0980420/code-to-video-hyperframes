import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AudioWaveform } from "../player/components/AudioWaveform";
import { useRenderClipContent } from "./useRenderClipContent";

describe("useRenderClipContent", () => {
  it("keeps audio clips on waveform rendering even inside active composition previews", () => {
    let renderedNode: React.ReactNode = null;

    function Harness() {
      const renderClipContent = useRenderClipContent({
        projectIdRef: { current: "demo" },
        compIdToSrc: new Map(),
        activePreviewUrl: "/api/projects/demo/preview/comp/compositions/horizontal.html",
        effectiveTimelineDuration: 55,
      });

      renderedNode = renderClipContent(
        {
          id: "audio-s2",
          tag: "audio",
          start: 17.8,
          duration: 7.2,
          track: 20,
          selector: "#audio-s2",
          src: "assets/voiceover/ig-s1-p2.wav",
        },
        { clip: "#111111", label: "#ffffff" },
      );

      return null;
    }

    renderToStaticMarkup(React.createElement(Harness));

    expect(renderedNode).toBeTruthy();
    expect(React.isValidElement(renderedNode)).toBe(true);

    const node = renderedNode as unknown as React.ReactElement<Record<string, unknown>>;
    expect(node.type).toBe(AudioWaveform);
    expect(node.props["audioUrl"]).toBe("/api/projects/demo/preview/assets/voiceover/ig-s1-p2.wav");
    expect(node.props["waveformUrl"]).toBe(
      "/api/projects/demo/waveform/assets/voiceover/ig-s1-p2.wav",
    );
  });
});
