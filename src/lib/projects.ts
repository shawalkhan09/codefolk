import all from "../data/projects.json";

export type Project = (typeof all)[number];

const showDrafts = import.meta.env.DEV || !!process.env.SHOW_DRAFTS;

// A project may not be published unless permission is "cleared".
export const projects: Project[] = all
  .filter((p) => showDrafts || p.permission === "cleared")
  .sort((a, b) => a.order - b.order);

// Homepage showcase: featured projects in curated editorial order.
export const featuredProjects: Project[] = projects.filter((p) => p.featured);

export const clientOf = (p: Project) => p.client || "Private client";
