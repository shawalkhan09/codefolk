// Centralized motion foundation: Lenis smooth scroll + GSAP/ScrollTrigger reveals,
// loader->hero choreography and an optional fine-pointer cursor.
// Reduced-motion users get a fully static, immediately-readable page.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(pointer: fine)");
const root = document.documentElement;

let lenis: Lenis | null = null;

function initLenis() {
  // Subtle: native feel with a little weight. No hijack, no syrup.
  lenis = new Lenis({ duration: 0.9, smoothWheel: true, anchors: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis?.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

function initReveals() {
  gsap.utils.toArray<HTMLElement>("[data-reveal], .reveal").forEach((el) => {
    el.style.transition = "none"; // GSAP drives these now; drop the CSS transition
    gsap.fromTo(
      el,
      { y: 26, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } }
    );
  });
}

function initParallax() {
  gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
    const depth = Number(el.dataset.parallax || "6");
    const scope = el.closest("[data-parallax-scope]") || el;
    gsap.fromTo(
      el,
      { yPercent: -depth },
      { yPercent: depth, ease: "none", scrollTrigger: { trigger: scope, start: "top bottom", end: "bottom top", scrub: true } }
    );
  });
}

function heroTimeline() {
  try {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo("[data-hero=line]", { yPercent: 112, autoAlpha: 0, filter: "blur(10px)" }, { yPercent: 0, autoAlpha: 1, filter: "blur(0px)", duration: 1.05, stagger: 0.12 })
      .fromTo("[data-hero=atmosphere]", { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.4 }, 0)
      .fromTo("[data-hero=support]", { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8 }, "-=0.55")
      .fromTo("[data-hero=cta]", { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7 }, "-=0.6")
      .fromTo("[data-hero=nav]", { autoAlpha: 0, y: -8 }, { autoAlpha: 1, y: 0, duration: 0.6 }, "-=0.7");
  } finally {
    root.classList.add("is-ready");
  }
}

function initCursor() {
  if (!finePointer.matches) return;
  const dot = document.createElement("span");
  dot.className = "cf-cursor";
  dot.setAttribute("aria-hidden", "true");
  document.body.appendChild(dot);
  let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y, label = "";
  const setLabel = (t: string) => {
    if (t === label) return;
    label = t;
    dot.dataset.state = t ? "label" : "";
    dot.textContent = t;
  };
  addEventListener(
    "pointermove",
    (e) => {
      tx = e.clientX;
      ty = e.clientY;
      const t = (e.target as HTMLElement).closest?.("[data-cursor]") as HTMLElement | null;
      setLabel(t?.dataset.cursor || "");
    },
    { passive: true }
  );
  gsap.ticker.add(() => {
    x += (tx - x) * 0.22;
    y += (ty - y) * 0.22;
    dot.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
  });
}

function initDraw() {
  gsap.utils.toArray<SVGGeometryElement>("[data-draw]").forEach((el) => {
    const len = el.getTotalLength();
    el.style.strokeDasharray = String(len);
    el.style.strokeDashoffset = String(len);
    gsap.to(el, {
      strokeDashoffset: 0,
      duration: 0.9,
      ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 86%", once: true },
    });
  });
}

function initNodes() {
  gsap.utils.toArray<SVGSVGElement>("[data-nodes]").forEach((svg) => {
    const kids = svg.querySelectorAll("rect, circle, text");
    gsap.fromTo(
      kids,
      { autoAlpha: 0, scale: 0.92, transformOrigin: "50% 50%" },
      { autoAlpha: 1, scale: 1, duration: 0.6, stagger: 0.07, ease: "power2.out", scrollTrigger: { trigger: svg, start: "top 86%", once: true } }
    );
  });
}

function initSysobj() {
  if (!finePointer.matches) return;
  const el = document.querySelector<HTMLElement>("[data-sysobj]");
  if (!el) return;
  let tx = 0, ty = 0, cx = 0, cy = 0;
  addEventListener(
    "pointermove",
    (e) => {
      tx = (e.clientX / innerWidth - 0.5) * 10;
      ty = (e.clientY / innerHeight - 0.5) * 10;
    },
    { passive: true }
  );
  gsap.ticker.add(() => {
    cx += (tx - cx) * 0.06;
    cy += (ty - cy) * 0.06;
    el.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
  });
}

function showAllStatic() {
  root.classList.add("is-ready", "reduce");
  document.querySelectorAll("[data-reveal], .reveal").forEach((e) => e.classList.add("in"));
}

let heroStarted = false;
function startHero() {
  if (heroStarted) return;
  heroStarted = true;
  heroTimeline();
}

function boot() {
  if (reduce.matches) {
    showAllStatic();
    return;
  }
  initLenis();
  initReveals();
  initParallax();
  initDraw();
  initNodes();
  initSysobj();
  initCursor();
  const loader = document.getElementById("ag-loader");
  if (loader) {
    document.addEventListener("cf:loader:leave", startHero, { once: true });
    setTimeout(startHero, 7000); // failsafe if the loader never reports
  } else {
    startHero();
  }
}

addEventListener("pagehide", () => {
  ScrollTrigger.getAll().forEach((st) => st.kill());
  lenis?.destroy();
});

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
