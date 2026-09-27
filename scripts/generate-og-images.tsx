// Regenerates the committed social-preview, per-project Open Graph, and PNG icon assets.
// Run with `npm run og` after changing a project's title, summary, difficulty, topics, or traits.
// Fonts are fetched once from Google Fonts (Inter, SIL Open Font License); CI never runs this.
import React from "react";
import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { projects } from "../content/projects";
import {
  hashOgInput,
  ogDirectory,
  ogManifestPath,
  ogSize,
  projectOgInput,
  projectOgPath,
  siteOgCopy,
} from "../lib/og-assets";

const color = {
  bg: "#f7f7f5",
  surface: "#ffffff",
  ink: "#181817",
  muted: "#5f5f59",
  line: "#dcdcd6",
  grid: "#ebebe6",
  accent: "#176b52",
  accentSoft: "#e3f1eb",
};

type Font = { name: string; data: ArrayBuffer; weight: 400 | 600 | 700; style: "normal" };

async function loadFonts(): Promise<Font[]> {
  const css = await (await fetch("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700")).text();
  const faces = [...css.matchAll(/font-weight: (\d+);[\s\S]*?url\((https:[^)]+\.ttf)\)/g)];
  if (faces.length < 3) throw new Error("Could not resolve Inter TTF files from Google Fonts");
  return Promise.all(
    faces.map(async ([, weight, url]) => ({
      name: "Inter",
      data: await (await fetch(url)).arrayBuffer(),
      weight: Number(weight) as Font["weight"],
      style: "normal" as const,
    })),
  );
}

/** The site mark: four building blocks, two filled, two outlined (matches app/icon.svg). */
function Mark({ size, radius = true }: { size: number; radius?: boolean }) {
  const unit = size / 64;
  const block = (left: number, top: number, filled: boolean) => (
    <div
      style={{
        position: "absolute",
        left: left * unit,
        top: top * unit,
        width: 15 * unit + 4 * unit,
        height: 15 * unit + 4 * unit,
        marginLeft: -2 * unit,
        marginTop: -2 * unit,
        border: `${4 * unit}px solid #ffffff`,
        background: filled ? "#ffffff" : "transparent",
      }}
    />
  );
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        width: size,
        height: size,
        borderRadius: radius ? 12 * unit : 0,
        background: color.accent,
      }}
    >
      {block(14, 14, false)}
      {block(35, 14, true)}
      {block(14, 35, true)}
      {block(35, 35, false)}
    </div>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        padding: "64px 72px",
        fontFamily: "Inter",
        color: color.ink,
        backgroundColor: color.bg,
        backgroundImage: `linear-gradient(${color.grid} 1px, transparent 1px), linear-gradient(90deg, ${color.grid} 1px, transparent 1px)`,
        backgroundSize: "48px 48px",
      }}
    >
      {children}
    </div>
  );
}

function Brand({ right }: { right?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Mark size={44} />
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5 }}>Build Real World</div>
      </div>
      {right ? <div style={{ fontSize: 20, fontWeight: 600, color: color.muted }}>{right}</div> : null}
    </div>
  );
}

function SitePreview() {
  return (
    <Frame>
      <Brand right={siteOgCopy.url} />
      <div style={{ display: "flex", flexDirection: "column", marginTop: 72 }}>
        <div style={{ maxWidth: 900, fontSize: 68, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2.5 }}>
          {siteOgCopy.headline}
        </div>
        <div style={{ maxWidth: 880, marginTop: 26, fontSize: 28, lineHeight: 1.4, color: color.muted }}>
          {siteOgCopy.summary}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", marginTop: "auto" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {siteOgCopy.flow.map((step, index) => (
            <div key={step} style={{ display: "flex", alignItems: "center" }}>
              {index > 0 ? <div style={{ width: 28, height: 2, background: color.accent }} /> : null}
              <div
                style={{
                  display: "flex",
                  padding: "10px 16px",
                  border: `2px solid ${index === 1 ? color.accent : color.line}`,
                  background: index === 1 ? color.accentSoft : color.surface,
                  fontSize: 20,
                  fontWeight: 600,
                }}
              >
                {step}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Frame>
  );
}

function Chip({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        padding: "7px 14px",
        border: `1.5px solid ${accent ? color.accent : color.line}`,
        borderRadius: 999,
        background: accent ? color.accentSoft : color.surface,
        color: accent ? color.accent : color.ink,
        fontSize: 20,
        fontWeight: 600,
      }}
    >
      {children}
    </div>
  );
}

function ProjectPreview({ input }: { input: ReturnType<typeof projectOgInput> }) {
  return (
    <Frame>
      <Brand right="System design case study" />
      <div style={{ display: "flex", flexDirection: "column", marginTop: 64 }}>
        <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.02, letterSpacing: -2.8 }}>{input.title}</div>
        <div style={{ maxWidth: 1000, marginTop: 24, fontSize: 30, lineHeight: 1.38, color: color.muted }}>
          {input.summary}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: "auto" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <Chip accent>{input.difficulty}</Chip>
          {input.topics.map((topic) => <Chip key={topic}>{topic}</Chip>)}
        </div>
        <div style={{ display: "flex", gap: 40, paddingTop: 20, borderTop: `1.5px solid ${color.line}`, fontSize: 21 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <span style={{ color: color.muted }}>Database</span>
            <span style={{ fontWeight: 700 }}>{input.primaryDb}</span>
          </div>
          {input.traits.length > 0 ? (
            <div style={{ display: "flex", gap: 10 }}>
              <span style={{ color: color.muted }}>Traits</span>
              <span style={{ fontWeight: 700 }}>{input.traits.join(" · ")}</span>
            </div>
          ) : null}
        </div>
      </div>
    </Frame>
  );
}

function IconImage({ size, radius }: { size: number; radius: boolean }) {
  return (
    <div style={{ display: "flex", width: "100%", height: "100%", background: radius ? "transparent" : color.accent }}>
      <Mark size={size} radius={radius} />
    </div>
  );
}

async function write(file: string, element: React.ReactElement, size: { width: number; height: number }, fonts: Font[]) {
  const response = new ImageResponse(element, { ...size, fonts });
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.from(await response.arrayBuffer()));
  console.log(`wrote ${file}`);
}

async function main() {
  const fonts = await loadFonts();
  const manifest: Record<string, string> = {};

  await write("public/social-preview.png", <SitePreview />, ogSize, fonts);
  manifest["social-preview"] = hashOgInput(siteOgCopy);

  for (const project of projects) {
    const input = projectOgInput(project);
    await write(path.join("public", projectOgPath(project.slug)), <ProjectPreview input={input} />, ogSize, fonts);
    manifest[`projects/${project.slug}`] = hashOgInput(input);
  }

  await write("public/apple-touch-icon.png", <IconImage size={180} radius={false} />, { width: 180, height: 180 }, fonts);
  await write("public/icon-192.png", <IconImage size={192} radius />, { width: 192, height: 192 }, fonts);
  await write("public/icon-512.png", <IconImage size={512} radius />, { width: 512, height: 512 }, fonts);

  fs.mkdirSync(ogDirectory, { recursive: true });
  fs.writeFileSync(ogManifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`wrote ${ogManifestPath}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
