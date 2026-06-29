import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, BarChart3, FileText, GitCompareArrows, Link2, ShieldCheck } from "lucide-react";
import { LOGO_URL } from "../config.js";

const links = [
  { href: "#overview", label: "Overview", icon: BarChart3, testId: "nav-overview-link" },
  { href: "#month-comparison", label: "Comparison", icon: GitCompareArrows, testId: "nav-month-comparison-link" },
  { href: "#archive", label: "Archive", icon: FileText, testId: "nav-archive-link" },
  { href: "#source-documents", label: "Source Documents", icon: Link2, testId: "nav-source-documents-link" },
  { href: "#methodology", label: "Methodology", icon: ShieldCheck, testId: "nav-methodology-link" },
];

const SECTION_IDS = links.map((link) => link.href.replace("#", ""));
const PROGRAMMATIC_SCROLL_ACTIVE_LOCK_MS = 2200;

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const scrollToSection = (sectionId, updateHistory = true) => {
  const section = document.getElementById(sectionId);
  if (!section) return;

  if (updateHistory) {
    window.history.pushState(null, "", `#${sectionId}`);
  }

  section.scrollIntoView({
    behavior: prefersReducedMotion() ? "auto" : "smooth",
    block: "start",
  });
};

const SectionNavigation = () => {
  const [activeSection, setActiveSection] = useState("overview");
  const navRef = useRef(null);
  const visibleSectionsRef = useRef(new Map());
  const activeLockRef = useRef({ sectionId: "", until: 0 });

  const lockActiveSection = useCallback((sectionId) => {
    activeLockRef.current = {
      sectionId,
      until: Date.now() + PROGRAMMATIC_SCROLL_ACTIVE_LOCK_MS,
    };
  }, []);

  const handleNavClick = useCallback((event, sectionId) => {
    event.preventDefault();
    setActiveSection(sectionId);
    lockActiveSection(sectionId);
    scrollToSection(sectionId);
  }, [lockActiveSection]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (Date.now() < activeLockRef.current.until && activeLockRef.current.sectionId) {
          setActiveSection(activeLockRef.current.sectionId);
          return;
        }

        const isNearPageBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 24;
        if (isNearPageBottom) {
          setActiveSection(SECTION_IDS[SECTION_IDS.length - 1]);
          return;
        }

        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visibleSectionsRef.current.set(entry.target.id, entry);
          } else {
            visibleSectionsRef.current.delete(entry.target.id);
          }
        });

        const stickyOffset = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--sticky-offset")) || 180;
        const visibleEntry = Array.from(visibleSectionsRef.current.values())
          .sort((a, b) => Math.abs(a.boundingClientRect.top - stickyOffset) - Math.abs(b.boundingClientRect.top - stickyOffset))[0];

        if (visibleEntry?.target?.id) {
          setActiveSection(visibleEntry.target.id);
        }
      },
      {
        root: null,
        rootMargin: "0px 0px -8% 0px",
        threshold: [0, 0.05, 0.2, 0.5],
      },
    );

    SECTION_IDS.forEach((sectionId) => {
      const section = document.getElementById(sectionId);
      if (section) observer.observe(section);
    });

    return () => {
      visibleSectionsRef.current.clear();
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const nav = navRef.current;
    const activeLink = navRef.current?.querySelector(`[data-section-id="${activeSection}"]`);
    if (!nav || !activeLink) return;

    nav.scrollTo({
      left: activeLink.offsetLeft - (nav.clientWidth / 2) + (activeLink.clientWidth / 2),
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, [activeSection]);

  useEffect(() => {
    const handleHashChange = () => {
      const sectionId = window.location.hash.replace("#", "");
      if (SECTION_IDS.includes(sectionId)) {
        setActiveSection(sectionId);
        lockActiveSection(sectionId);
        scrollToSection(sectionId, false);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("popstate", handleHashChange);

    const initialSectionId = window.location.hash.replace("#", "");
    if (SECTION_IDS.includes(initialSectionId)) {
      window.setTimeout(() => handleHashChange(), 80);
    }

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("popstate", handleHashChange);
    };
  }, [lockActiveSection]);

  return (
    <div className="section-nav-shell" data-testid="section-navigation-shell">
      <nav ref={navRef} className="nav-links" data-testid="primary-navigation" aria-label="Dashboard sections">
        {links.map(({ href, label, icon: Icon, testId }) => {
          const sectionId = href.replace("#", "");
          const isActive = activeSection === sectionId;
          return (
            <a
              key={href}
              href={href}
              data-testid={testId}
              data-section-id={sectionId}
              className={`nav-button ${isActive ? "nav-button-active" : ""}`}
              aria-current={isActive ? "page" : undefined}
              onClick={(event) => handleNavClick(event, sectionId)}
            >
              <Icon size={16} aria-hidden="true" />
              {label}
            </a>
          );
        })}
      </nav>
    </div>
  );
};

export const BackToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { root: null, threshold: 0 },
    );

    const sentinel = document.getElementById("back-to-top-sentinel");
    if (sentinel) observer.observe(sentinel);

    return () => observer.disconnect();
  }, []);

  const handleBackToTop = () => {
    window.history.pushState(null, "", window.location.pathname + window.location.search);
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      data-testid="back-to-top-button"
      className={`back-to-top-button ${isVisible ? "back-to-top-button-visible" : ""}`}
      aria-label="Back to top"
      onClick={handleBackToTop}
    >
      <ArrowUp size={18} aria-hidden="true" />
      <span>Top</span>
    </button>
  );
};

export const Header = ({ months, selectedMonth, onMonthChange }) => (
  <>
    <header data-testid="site-header" className="site-header">
      <div className="header-inner">
        <div className="brand-lockup" data-testid="brand-lockup">
          <img src={LOGO_URL} alt="Jamaica In Focus logo" data-testid="header-logo" className="brand-logo" />
          <div>
            <p data-testid="brand-name" className="brand-name">Jamaica In Focus</p>
            <p data-testid="brand-tagline" className="brand-tagline">Receipts checked. Public finance tracked.</p>
          </div>
        </div>
        <select data-testid="month-select-trigger" className="month-select" value={selectedMonth || ""} onChange={(event) => onMonthChange(event.target.value)}>
          {months.map((month) => (
            <option key={month.month_sort} value={month.month_sort} data-testid={`month-select-option-${month.month_sort}`}>
              {month.month_label}
            </option>
          ))}
        </select>
      </div>
    </header>
    <SectionNavigation />
  </>
);