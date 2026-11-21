import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flush } from "solid-js";
import { render } from "@solidjs/web";
import App from "./App.jsx";
import { navigate } from "./router.js";

let dispose;
let root;

const settle = async () => {
  for (let i = 0; i < 5; i++) {
    await Promise.resolve();
    flush();
  }
};

beforeEach(() => {
  root = document.createElement("div");
  document.body.appendChild(root);
  navigate("/");
  dispose = render(() => <App />, root);
});

afterEach(() => {
  dispose();
  root.remove();
  vi.restoreAllMocks();
});

describe("resume page", () => {
  it("renders every section and the contact links", () => {
    const text = root.textContent;
    for (const heading of ["Work Experience", "Education", "Personal Projects", "Key Skills"]) {
      expect(text).toContain(heading);
    }
    expect(text).toContain("Christopher M. Jones");
    expect(root.querySelector('a[href="mailto:chrismjones81@gmail.com"]')).not.toBeNull();
    expect(root.querySelector('a[href="https://github.com/christophmckinzie"]')).not.toBeNull();
  });
});

describe("navigation", () => {
  it("toggles the mobile menu by class", async () => {
    const menu = root.querySelector("#navbarNavDropdown");
    expect(menu.classList.contains("show")).toBe(false);
    root.querySelector(".navbar-toggler").click();
    await settle();
    expect(menu.classList.contains("show")).toBe(true);
  });

  it("switches pages without a reload and marks the active link", async () => {
    root.querySelector('.navbar a[href="/weather-routing"]').click();
    await settle();
    expect(location.pathname).toBe("/weather-routing");
    expect(root.textContent).toContain("Finding Weather Along A Driving Route");
    expect(root.querySelector('.navbar a[href="/weather-routing"]').classList.contains("active")).toBe(true);
  });
});

describe("weather page", () => {
  beforeEach(async () => {
    navigate("/weather-routing");
    await settle();
  });

  it("limits the date picker to tomorrow through four days out", () => {
    const date = root.querySelector("#date");
    expect(date.min).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(date.max > date.min).toBe(true);
    expect(date.value).toBe(date.min);
  });

  it("posts the form, then shows the returned map", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ map_url: "/static/map.html" }) });
    vi.stubGlobal("fetch", fetchMock);

    root.querySelector("form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await settle();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/generate-weather-map");
    expect(JSON.parse(options.body)).toMatchObject({ start: "Seattle, WA", end: "Moses Lake, WA" });
    expect(root.querySelector("iframe").getAttribute("src")).toMatch(/^\/static\/map\.html\?t=\d+$/);
  });

  it("shows the error message when the server fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    root.querySelector("form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await settle();
    expect(root.textContent).toContain("Failed to generate map");
    expect(root.textContent).toContain("Retry");
  });
});
