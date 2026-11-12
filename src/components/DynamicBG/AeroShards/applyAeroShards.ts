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

async function resolveBaseColor(): Promise<string> {
  const mode = $shardsColorMode.get();
  if (mode === "manual") return $shardsColor.get();
  return getPaletteColor();
}

async function loadShardsComponent(): Promise<any> {
  // Try WebGPU first, fall back to Canvas2D
  if (navigator.gpu) {
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (adapter) {
        shardsLogger.debug("WebGPU available, using GPU shards");
        const { default: AeroShards } = await import("./AeroShards.jsx");
        return AeroShards;
      }
    } catch (e) {
      shardsLogger.warn("WebGPU init failed, falling back to Canvas2D", e);
    }
  }
  shardsLogger.debug("Using Canvas2D fallback shards");
  const { default: Fallback } = await import("./AeroShardsFallback.jsx");
  return Fallback;
}

function renderShards(
  React: any,
  ShardsComponent: any,
  shardColor: string,
  accentColor: string,
  intro: boolean,
) {
  if (!reactRoot) return;
  reactRoot.render(
    React.createElement(ShardsComponent, {
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
      intro,
      pulseOnClick: false,
      holdToGather: false,
      style: { position: "absolute", inset: 0, width: "100%", height: "100%" },
    })
  );
}

let cachedComponent: any = null;

export async function applyAeroShardsBackground(host: HTMLElement): Promise<void> {
  removeAeroShards();

  const container = document.createElement("div");
  container.className = "spicy-dynamic-bg spicy-aero-shards";
  container.style.cssText = "position:absolute;inset:0;z-index:0;overflow:hidden;";
  host.appendChild(container);
  currentRoot = container;

  const React = await import("react");
  const ReactDOM = await import("react-dom/client");

  if (!cachedComponent) {
    cachedComponent = await loadShardsComponent();
  }

  const baseColor = await resolveBaseColor();
  const { shardColor, accentColor } = getShardColors(baseColor);

  reactRoot = ReactDOM.createRoot(container);
  renderShards(React, cachedComponent, shardColor, accentColor, true);

  const update = async () => {
    if (!currentRoot || !reactRoot) return;
    const R = await import("react");
    const base = await resolveBaseColor();
    const colors = getShardColors(base);
    renderShards(R, cachedComponent, colors.shardColor, colors.accentColor, false);
  };

  const d1 = $shardsColorMode.listen(update);
  const d2 = $shardsColor.listen(update);
  disposeListener = () => { d1(); d2(); };

  shardsLogger.debug("Aero Shards mounted", { shardColor, accentColor });
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
