import { useEffect, useState } from "react";

const hasReducedMotion = () => (
  typeof window !== "undefined"
  && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
);

export const useCountUp = (value, duration = 600) => {
  const finalValue = Number.isFinite(Number(value)) ? Number(value) : 0;
  const [displayValue, setDisplayValue] = useState(() => (hasReducedMotion() ? finalValue : 0));

  useEffect(() => {
    if (hasReducedMotion() || typeof window.requestAnimationFrame !== "function") {
      setDisplayValue(finalValue);
      return undefined;
    }

    let animationFrame = 0;
    const startedAt = window.performance.now();
    setDisplayValue(0);

    const tick = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - ((1 - progress) ** 3);
      setDisplayValue(Math.round(finalValue * eased));

      if (progress < 1) animationFrame = window.requestAnimationFrame(tick);
    };

    animationFrame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [duration, finalValue]);

  return displayValue;
};

export const useSectionReveals = (rootRef, ready = true) => {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !ready) return undefined;

    const sections = Array.from(root.children).filter((node) => (
      node.tagName === "SECTION"
      && node.id !== "overview"
      && node.id !== "spending-overview"
    ));

    sections.forEach((section) => section.classList.add("motion-reveal-section"));

    if (hasReducedMotion() || typeof window.IntersectionObserver !== "function") {
      sections.forEach((section) => section.classList.add("is-motion-revealed"));
      return undefined;
    }

    const observer = new window.IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-motion-revealed");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -10%", threshold: 0.08 });

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [ready, rootRef]);
};
