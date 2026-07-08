import type { MetadataRoute } from "next";
import { caseTypes, judges } from "@/lib/data";

const baseUrl = "https://justiceclockindia.org";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/case-types",
    "/data",
    "/judges",
    "/launch-checklist",
    "/methodology",
    "/sources",
    "/about",
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
    })),
    ...caseTypes.map((item) => ({
      url: `${baseUrl}/case-types/${item.slug}`,
      lastModified: new Date(),
    })),
    ...judges.map((judge) => ({
      url: `${baseUrl}/judges/${judge.slug}`,
      lastModified: new Date(),
    })),
  ];
}
