import { $shardsColor, $shardsColorMode } from "../../../utils/stores.ts";
import { SpotifyPlayer } from "../../Global/SpotifyPlayer.ts";
import Logger from "../../../utils/Logger.ts";

const shardsLogger = new Logger("Aurora Background");

let currentRoot: HTMLElement | null = null;
let reactRoot: any = null;
let disposeListener: (() => void) | null = null;

async function getPaletteColors(): Promise<string[]> {
  try {
    const coverUri = SpotifyPlayer.GetCover("large") ?? "";
    if (!coverUri) return ["#891a1a", "#a92a4a", "#891a1a"];
    const imageId = coverUri.startsWith("spotify:image:")
      ? coverUri.replace("spotify:image:", "")
      : coverUri;
    const result = await Spicetify.colorExtractor(imageId);
    if (result) {
      const colors = Object.values(result) as string[];
      if (colors.length >= 3) return [colors[0], colors[1], colors[2]];
      if (colors.length >= 2) return [colors[0], colors[1], colors[0]];
      if (colors.length >= 1) return [colors[0], colors[0], colors[0]];
    }
  } catch (err) {
    shardsLogger.warn("Failed to extract colors from cover", err);
  }
  return ["#891a1a", "#a92a4a", "#891a1a"];
}

function deriveStops(baseColor: string): string[] {
  const r = parseInt(baseColor.slice(1, 3), 16);
  const g = parseInt(baseColor.slice(3, 5), 16);
  const b = parseInt(baseColor.slice(5, 7), 16);
  const r2 = Math.min(255, r + 40);
  const g2 = Math.min(255, g + 20);
  const b2 = Math.min(255, b + 60);
  const accent = `#${r2.toString(16).padStart(2, "0")}${g2.toString(16).padStart(2, "0")}${b2.toString(16).padStart(2, "0")}`;
  return [baseColor, accent, baseColor];
}

async function resolveColorStops(): Promise<string[]> {
  const mode = $shardsColorMode.get();
  if (mode === "manual") return deriveStops($shardsColor.get());
  return getPaletteColors();
}

function renderAurora(React: any, AuroraComponent: any, colorStops: string[], intro: boolean) {
  if (!reactRoot) return;
  reactRoot.render(
    React.createElement(AuroraComponent, {
      colorStops,
      amplitude: 1.2,
      blend: 0.6,
      speed: 0.5,
      height: 0.5,
      scale: 1,
      glow: 0.8,
      brightness: 0.8,
      layers: 2,
      direction: "top",
      mouseInteraction: false,
      intro,
      opacity: 0.9,
      style: { position: "absolute", inset: 0, width: "100%", height: "100%" },
    })
  );
}

export async function applyAeroShardsBackground(host: HTMLElement): Promise<void> {
  removeAeroShards();

  const container = document.createElement("div");
  container.className = "spicy-dynamic-bg spicy-aero-shards";
  container.style.cssText = "position:absolute;inset:0;z-index:0;overflow:hidden;";
  host.appendChild(container);
  currentRoot = container;

  const React = await import("react");
  const ReactDOM = await import("react-dom/client");
  const { default: Aurora } = await import("./AeroShards.jsx");

  const colorStops = await resolveColorStops();

  reactRoot = ReactDOM.createRoot(container);
  renderAurora(React, Aurora, colorStops, true);

  const update = async () => {
    if (!currentRoot || !reactRoot) return;
    const R = await import("react");
    const { default: A } = await import("./AeroShards.jsx");
    const stops = await resolveColorStops();
    renderAurora(R, A, stops, false);
  };

  const d1 = $shardsColorMode.listen(update);
  const d2 = $shardsColor.listen(update);
  disposeListener = () => { d1(); d2(); };

  shardsLogger.debug("Aurora background mounted", { colorStops });
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
