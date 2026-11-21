import { createSignal, onSettled } from "solid-js";

// Tiny History API router: three pages don't need a library.
const [path, setPath] = createSignal(location.pathname);

export { path };

export function navigate(to) {
  history.pushState({}, "", to);
  setPath(location.pathname);
}

// Call once from the root component so the browser back/forward buttons work.
// The returned cleanup removes the listener.
export function useBackButton() {
  onSettled(() => {
    const onPop = () => setPath(location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  });
}

// Props for an in-app link: real href (so middle-click and copy-link work),
// but a plain left click navigates without a page load.
export function linkProps(to) {
  return {
    href: to,
    onClick: (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      navigate(to);
    },
  };
}
