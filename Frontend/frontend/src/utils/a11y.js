/**
 * a11y.js — Accessibility utilities
 *
 * Helpers for screen-reader text, focus management, and ARIA patterns
 * used across the AI Beauty Consultant application.
 */

/**
 * VisuallyHidden — renders text only visible to screen readers.
 * Use for icon-only buttons: <button><FaSearch /><VisuallyHidden>Search</VisuallyHidden></button>
 */
export function VisuallyHidden({ children }) {
  return (
    <span
      style={{
        position: "absolute",
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
        whiteSpace: "nowrap",
        border: 0,
      }}
    >
      {children}
    </span>
  );
}

/**
 * useFocusTrap — traps keyboard focus inside a modal/dialog.
 * Usage: const ref = useFocusTrap(isOpen);
 *        <div ref={ref}>...</div>
 */
export function useFocusTrap(isActive) {
  const { useRef, useEffect } = require("react");
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const focusable = containerRef.current.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    function handleKeyDown(e) {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }

    first?.focus();
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isActive]);

  return containerRef;
}

/**
 * announceToScreenReader — programmatically announce a message.
 * Creates a live region if one doesn't exist.
 */
export function announceToScreenReader(message, politeness = "polite") {
  const id = `sr-live-${politeness}`;
  let region = document.getElementById(id);
  if (!region) {
    region = document.createElement("div");
    region.id = id;
    region.setAttribute("aria-live", politeness);
    region.setAttribute("aria-atomic", "true");
    region.style.cssText =
      "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0";
    document.body.appendChild(region);
  }
  // Clear then set to trigger announcement
  region.textContent = "";
  requestAnimationFrame(() => {
    region.textContent = message;
  });
}

/**
 * getFormAriaProps — returns ARIA props for a form field.
 * Usage: <input {...getFormAriaProps("email", error, "Email address")} />
 */
export function getFormAriaProps(fieldId, errorMessage, label) {
  return {
    id: fieldId,
    "aria-label": label,
    "aria-describedby": errorMessage ? `${fieldId}-error` : undefined,
    "aria-invalid": errorMessage ? "true" : undefined,
  };
}
