import { useStore } from "@nanostores/react";
import {
  $backgroundBlur,
  $backgroundStyle,
  $shardsColor,
  $shardsColorMode,
  $showNpvDynamicBg,
  BACKGROUND_STYLES,
  type BackgroundStyle,
  type ShardsColorMode,
} from "../../../utils/stores.ts";
import { $experiment, getExperiment } from "../../../utils/experiments.ts";
import { Select, Slider, Toggle } from "./components.tsx";
import { BackgroundIcon } from "./icons.tsx";
import type { GroupDef, SectionDef } from "./model.ts";

export const BACKGROUND_STYLE_LABELS: Record<BackgroundStyle, string> = {
  dynamic: "Dynamic (Kawarp)",
  artist: "Artist Image",
  cover: "Cover Art",
  color: "Cover Colors",
  shards: "Aurora",
  none: "None (Transparent)",
};

// Built once: the Control components must keep their identity across renders.
const groups: GroupDef[] = [
  {
    title: "Lyrics View",
    settings: [
      {
        id: "backgroundStyle",
        label: "Background",
        description:
          "Dynamic (Kawarp) swirls the cover art in time with the music. Artist Image uses the artist's header photo, or the cover when there isn't one. None (Transparent) leaves the page see-through, so whatever is behind it shows.",
        keywords: "static animated kawarp artist header cover art color colors image transparent none theme",
        useNote: () => {
          const style = useStore($backgroundStyle);
          const canvasStage = useStore($experiment("canvasImmersive"));
          return (
            style !== "dynamic" &&
            canvasStage &&
            `${getExperiment("canvasImmersive").label} only plays over Dynamic (Kawarp), so it won't show with ${BACKGROUND_STYLE_LABELS[style] ?? "this background"}.`
          );
        },
        Control: ({ label }) => (
          <Select
            label={label}
            value={useStore($backgroundStyle)}
            options={[...BACKGROUND_STYLES]}
            labels={BACKGROUND_STYLES.map((style) => BACKGROUND_STYLE_LABELS[style])}
            onChange={(v) => $backgroundStyle.set(v as BackgroundStyle)}
          />
        ),
      },
      {
        id: "backgroundBlur",
        label: "Image Blur",
        description: "Softens the Artist Image and Cover Art backgrounds.",
        keywords: "static background blur",
        stacked: true,
        useDisabled: () => {
          const style = useStore($backgroundStyle);
          return style !== "artist" && style !== "cover" && "Only applies to Artist Image and Cover Art.";
        },
        Control: ({ disabled, label }) => (
          <Slider
            label={label}
            value={useStore($backgroundBlur)}
            min={0}
            max={48}
            step={1}
            defaultValue={0}
            unit="px"
            onChange={(v) => $backgroundBlur.set(v)}
            disabled={disabled}
          />
        ),
      },
      {
        id: "shardsColorMode",
        label: "Shards Color",
        description: "Auto picks colors from the album art. Manual lets you choose a fixed color.",
        keywords: "aero shards webgpu color auto manual",
        useDisabled: () => {
          const style = useStore($backgroundStyle);
          return style !== "shards" && "Only applies to Aero Shards.";
        },
        Control: ({ disabled, label }) => (
          <Select
            label={label}
            value={useStore($shardsColorMode)}
            options={["auto", "manual"] as ShardsColorMode[]}
            labels={["Auto (Album Art)", "Manual"]}
            onChange={(v) => $shardsColorMode.set(v as ShardsColorMode)}
            disabled={disabled}
          />
        ),
      },
      {
        id: "shardsColor",
        label: "Shards Manual Color",
        description: "The base color used when Shards Color is set to Manual.",
        keywords: "aero shards webgpu color picker manual hex",
        useDisabled: () => {
          const style = useStore($backgroundStyle);
          const mode = useStore($shardsColorMode);
          if (style !== "shards") return "Only applies to Aero Shards.";
          if (mode !== "manual") return "Set Shards Color to Manual first.";
          return false;
        },
        Control: ({ disabled, label }) => (
          <input
            type="color"
            className="sl-sp-select"
            aria-label={label}
            value={useStore($shardsColor)}
            onChange={(e) => $shardsColor.set(e.currentTarget.value)}
            disabled={disabled}
            style={{ width: 48, height: 32, padding: 2, cursor: disabled ? "default" : "pointer" }}
          />
        ),
      },
    ],
  },
  {
    title: "Now Playing Sidebar",
    settings: [
      {
        id: "showNpvDynamicBg",
        label: "Animated Background",
        description: "Show the Dynamic (Kawarp) background behind the Now Playing sidebar.",
        keywords: "dynamic background npv now playing view kawarp",
        Control: ({ label }) => (
          <Toggle
            label={label}
            checked={useStore($showNpvDynamicBg)}
            onChange={(v) => $showNpvDynamicBg.set(v)}
          />
        ),
      },
    ],
  },
];

export const backgroundSection: SectionDef = {
  id: "background",
  title: "Background",
  icon: BackgroundIcon,
  groups: () => groups,
};
