import { $shardsColor, $shardsColorMode } from "../../../utils/stores.ts";
import { SpotifyPlayer } from "../../Global/SpotifyPlayer.ts";
import Logger from "../../../utils/Logger.ts";

const shardsLogger = new Logger("Aero Shards Background");

let currentRoot: HTMLElement | null = null;
let reactRoot: any = null;
let disposeListener: (() => void) | null = null;

async function getPaletteColor(): Promise<string> {
  try {
    const coverUri = SpotifyPlayer.GetCover("large") ?? "";
    if (!coverUri) return "#891a1a";
    const imageId = coverUri.startsWith("spotify:image:")
      ? coverUri.replace("spotify:image:", "")
      : coverUri;
    const result = await Spicetify.colorExtractor(imageId);
    if (result) {
      const colors = Object.values(result);
      if (colors.length > 0) return colors[0] as string;
    }
  } catch (err) {
    shardsLogger.warn("Failed to extract color from cover", err);
  }
  return "#891a1a";
}

function getShardColors(baseColor: string): { shardColor: string; accentColor: string } {
  const r = parseInt(baseColor.slice(1, 3), 16);
  const g = parseInt(baseColor.slice(3, 5), 16);
  const b = parseInt(baseColor.slice(5, 7), 16);
  const accentR = Math.min(255, r + 40);
  const accentG = Math.min(255, g + 20);
  const accentB = Math.min(255, b + 60);
  const accentColor = `#${accentR.toString(16).padStart(2, "0")}${accentG.toString(16).padStart(2, "0")}${accentB.toString(16).padStart(2, "0")}`;
  return { shardColor: baseColor, accentColor };
}

export async function applyAeroShardsBackground(host: HTMLElement): Promise<void> {
  if (!navigator.gpu) {
    shardsLogger.warn("WebGPU not available — cannot render Aero Shards background");
    return;
  }

  removeAeroShards();

  const container = document.createElement("div");
  container.className = "spicy-dynamic-bg spicy-aero-shards";
  container.style.cssText = "position:absolute;inset:0;z-index:0;overflow:hidden;";
  host.prepend(container);
  currentRoot = container;

  const React = await import("react");
  const ReactDOM = await import("react-dom/client");
  const { default: AeroShards } = await import("./AeroShards.jsx");

  const mode = $shardsColorMode.get();
  let baseColor = $shardsColor.get();
  if (mode === "auto") {
    baseColor = await getPaletteColor();
  }
  const { shardColor, accentColor } = getShardColors(baseColor);

  reactRoot = ReactDOM.createRoot(container);
  reactRoot.render(
    React.createElement(AeroShards, {
      shardColor,
      accentColor,
      backgroundColor: "transparent",
      count: 800,
      speed: 0.6,
      glow: 0.3,
      grain: 0.04,
      vignette: 0.2,
      depthOfField: 0.6,
      mouseInteraction: false,
      intro: true,
      pulseOnClick: false,
      holdToGather: false,
      style: { position: "absolute", inset: 0, width: "100%", height: "100%" },
    })
  );

  disposeListener = $shardsColorMode.listen(() => updateShardsColor());
  const disposeColor = $shardsColor.listen(() => updateShardsColor());
  const origDispose = disposeListener;
  disposeListener = () => { origDispose(); disposeColor(); };
}

async function updateShardsColor() {
  if (!currentRoot || !reactRoot) return;
  const React = await import("react");
  const { default: AeroShards } = await import("./AeroShards.jsx");

  const mode = $shardsColorMode.get();
  let baseColor = $shardsColor.get();
  if (mode === "auto") {
    baseColor = await getPaletteColor();
  }
  const { shardColor, accentColor } = getShardColors(baseColor);

  reactRoot.render(
    React.createElement(AeroShards, {
      shardColor,
      accentColor,
      backgroundColor: "transparent",
      count: 800,
      speed: 0.6,
      glow: 0.3,
      grain: 0.04,
      vignette: 0.2,
      depthOfField: 0.6,
      mouseInteraction: false,
      intro: false,
      pulseOnClick: false,
      holdToGather: false,
      style: { position: "absolute", inset: 0, width: "100%", height: "100%" },
    })
  );
}

export function removeAeroShards() {
  if (reactRoot) {
    reactRoot.unmount();
    reactRoot = null;
  }
  if (currentRoot) {
    currentRoot.remove();
    currentRoot = null;
  }
  if (disposeListener) {
    disposeListener();
    disposeListener = null;
  }
}
