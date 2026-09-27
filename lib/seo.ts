import type { Metadata } from "next";
import type { Project } from "./types";
import { absoluteUrl, site } from "./site";
import { ogSize, projectOgPath } from "./og-assets";

type SocialImage = { url: string; width: number; height: number; alt: string };

export const sitePreview: SocialImage = { url: absoluteUrl("/social-preview.png"), ...ogSize, alt: "Build Real World: system design, one real product at a time" };

export function pageMetadata({ title, description, path, index = true, type = "website", image = sitePreview }: { title: string; description: string; path: string; index?: boolean; type?: "website" | "article"; image?: SocialImage }): Metadata {
  const url = absoluteUrl(path);
  const socialTitle = `${title} | ${site.name}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: index ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { type, siteName: site.name, title: socialTitle, description, url, images: [image] },
    twitter: { card: "summary_large_image", title: socialTitle, description, images: [{ url: image.url, alt: image.alt }] },
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
    image: { url: absoluteUrl(projectOgPath(project.slug)), ...ogSize, alt: `${project.title} system design case study` },
  });
}

export function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export type Crumb = { name: string; path: string };

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({ "@type": "ListItem", position: index + 1, name: crumb.name, item: absoluteUrl(crumb.path) })),
  };
}

/** Shared TechArticle/LearningResource node for case studies, patterns, and edge cases. */
export function articleJsonLd({ headline, description, path, resourceType, about, educationalLevel, image = sitePreview.url }: { headline: string; description: string; path: string; resourceType: string; about: string[]; educationalLevel?: string; image?: string }) {
  const url = absoluteUrl(path);
  return {
    "@type": ["TechArticle", "LearningResource"],
    headline,
    description,
    url,
    mainEntityOfPage: url,
    image,
    inLanguage: "en",
    author: { "@type": "Person", name: site.author, url: site.github },
    publisher: { "@type": "Organization", name: site.name, url: absoluteUrl("/"), logo: absoluteUrl("/icon-512.png") },
    isAccessibleForFree: true,
    license: "https://creativecommons.org/licenses/by/4.0/",
    learningResourceType: resourceType,
    ...(educationalLevel ? { educationalLevel } : {}),
    about,
    dateModified: site.releaseDate,
  };
}
