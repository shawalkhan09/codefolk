import all from "../data/projects.json";

export type Project = (typeof all)[number];

const showDrafts = import.meta.env.DEV || !!process.env.SHOW_DRAFTS;

// A project may not be published unless permission is "cleared".
export const projects: Project[] = all.filter((p) => showDrafts || p.permission === "cleared");
export const clientOf = (p: Project) => p.client || "Private client";
