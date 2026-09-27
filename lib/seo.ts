import type { Metadata } from "next";
import type { Project } from "./types";
import { absoluteUrl, site } from "./site";

const preview = { url: absoluteUrl("/social-preview.png"), width: 1200, height: 630, alt: "Build Real World — production-grade system design" };

export function pageMetadata({ title, description, path, index = true, type = "website" }: { title: string; description: string; path: string; index?: boolean; type?: "website" | "article" }): Metadata {
  const url = absoluteUrl(path);
  const socialTitle = `${title} | ${site.name}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: index ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { type, siteName: site.name, title: socialTitle, description, url, images: [preview] },
    twitter: { card: "summary_large_image", title: socialTitle, description, images: [preview.url] },
  };
}

const projectTitles: Record<string, string> = {
  ecommerce: "E-commerce System Design: Architecture, Database & Scaling",
  "food-delivery": "Food Delivery System Design: Dispatch, Data & Scaling",
  "ride-hailing": "Ride Hailing System Design: Matching, Realtime & Scale",
  "hotel-pms": "Hotel PMS Architecture: Reservations, Folios & Operations",
  "appointment-saas": "Appointment Scheduling System Design: Booking & Timezones",
  "project-management": "Project Management System Design: Realtime SaaS Architecture",
  "video-streaming": "Video Streaming Architecture: Ingest, Transcoding & CDN",
  "social-network": "Social Network System Design: Feeds, Graphs & Moderation",
  "cloud-file-storage": "Cloud File Storage System Design: Uploads, ACLs & Sync",
  "payment-platform": "Payment System Architecture: Idempotency, Ledger & Webhooks",
};

export function projectMetadata(project: Project): Metadata {
  return pageMetadata({
    title: projectTitles[project.slug] ?? `${project.title} System Design`,
    description: `${project.summary} Explore its requirements, PostgreSQL model, APIs, concurrency controls, failure recovery, security, and scale evolution.`,
    path: `/projects/${project.slug}/`,
    type: "article",
  });
}

export function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
