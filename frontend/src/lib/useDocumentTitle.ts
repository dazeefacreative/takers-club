import { BRAND } from "@/lib/brand";
import { useEffect } from "react";

// Updates title + meta description/OG/Twitter tags/canonical for the current
// page, restoring the previous values on unmount. Note: this only affects
// what's in the DOM after JS runs, so it helps Google's JS-rendering crawler
// and anyone viewing the page directly, but non-JS social-preview scrapers
// (Facebook, Slack, etc.) will still see the static index.html tags on deep
// links — that would need server-side rendering to fix properly.
export function useDocumentTitle(title: string, description?: string, image?: string) {
  useEffect(() => {
    const previousTitle = document.title;
    const fullTitle = `${title} - ${BRAND.name}`;
    document.title = fullTitle;

    const restores: Array<() => void> = [];
    const trackMeta = (selector: string, content: string) => {
      const el = document.querySelector(selector);
      if (!el) return;
      const previous = el.getAttribute("content");
      el.setAttribute("content", content);
      restores.push(() => el.setAttribute("content", previous ?? ""));
    };

    trackMeta('meta[property="og:title"]', fullTitle);
    trackMeta('meta[name="twitter:title"]', fullTitle);
    trackMeta('meta[property="og:url"]', window.location.href);

    if (description) {
      trackMeta('meta[name="description"]', description);
      trackMeta('meta[property="og:description"]', description);
      trackMeta('meta[name="twitter:description"]', description);
    }

    if (image) {
      trackMeta('meta[property="og:image"]', image);
      trackMeta('meta[name="twitter:image"]', image);
    }

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      const previousHref = canonical.getAttribute("href");
      canonical.setAttribute("href", window.location.origin + window.location.pathname);
      restores.push(() => canonical.setAttribute("href", previousHref ?? ""));
    }

    return () => {
      document.title = previousTitle;
      restores.forEach((restore) => restore());
    };
  }, [title, description, image]);
}
