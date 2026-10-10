// Anything in [square brackets] renders as a yellow placeholder and is flagged by the build check.
export const site = {
  name: "Codefolk",
  year: "2026",
  whatsappDisplay: "+92 341 5653742",
  whatsappDigits: "923415653742", // e.g. "923001234567" -> links to wa.me
  instagramDisplay: "[@handle]",
  instagramHandle: "", // e.g. "youragency"
  privacyEmail: "[email address]",
  privacyUpdated: "[date]",
  location: "Peshawar and remote",
  formEndpoint: import.meta.env.PUBLIC_FORM_ENDPOINT || "",
};

export const waHref = site.whatsappDigits ? `https://wa.me/${site.whatsappDigits}` : "/contact/";
export const igHref = site.instagramHandle ? `https://instagram.com/${site.instagramHandle}` : "/contact/";

export const systems: Record<string, string> = {
  restaurant: "Restaurant",
  academy: "Academy",
  "real-estate": "Real estate",
  invoicing: "Invoicing and stock",
  madrassa: "Madrassa",
  commerce: "Commerce",
  "brand-site": "Brand & motion",
};

// Editorial capabilities index (homepage). Each row: title, one-line description, small capability list.
export const capabilities = [
  ["Software Engineering", "Production systems built to be maintained, not demoed.", ["Architecture", "APIs & data models", "Deployment & hosting"]],
  ["Digital Products", "Consumer and staff-facing products with a point of view.", ["Web apps", "POS & ordering", "Commerce"]],
  ["Business Systems", "The operational backbone: records, workflows and reporting.", ["ERP & admin", "Invoicing & stock", "Attendance & CRM"]],
  ["Web Experiences", "Brand sites and platforms where the craft is visible.", ["CMS-driven sites", "Motion & scroll", "Art direction"]],
  ["Product Design", "Interfaces designed around the workflow people actually use.", ["UI systems", "Workflow design", "Design handoff"]],
] as const;

// "" = not provided yet (shows a placeholder pill); null = deliberately omitted (no pill).
export const team = [
  { name: "Muzamil Shiraz", role: "Product and Delivery", photo: { src: "/team/muzamil-800.webp", srcset: "/team/muzamil-400.webp 400w, /team/muzamil-800.webp 800w", width: 800, height: 840 }, website: "https://www.muzamil.codes/", github: "https://github.com/muz4miL", linkedin: "https://www.linkedin.com/in/muz4mil9/" },
  { name: "Shawal Khan", role: "Sales and Client Success", photo: { src: "/team/shawal-800.webp", srcset: "/team/shawal-400.webp 400w, /team/shawal-800.webp 800w, /team/shawal-1000.webp 1000w", width: 1000, height: 1000 }, website: "https://www.shawalkhan.dev/", github: "https://github.com/shawalkhan09", linkedin: "https://www.linkedin.com/in/shawalkhan09" },
  { name: "Shaheer Haider", role: "Content and Growth", photo: { src: "/team/shaheer-800.webp", srcset: "/team/shaheer-400.webp 400w, /team/shaheer-800.webp 800w, /team/shaheer-1000.webp 1000w", width: 1000, height: 1160 }, website: null, github: "https://github.com/shaheerhaider23", linkedin: "https://www.linkedin.com/in/shaheerhaider123/" },
]; // roles are provisional until the team meeting
