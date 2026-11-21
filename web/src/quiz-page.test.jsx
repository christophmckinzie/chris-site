import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flush } from "solid-js";
import { render } from "@solidjs/web";

// A stand-in for Mapbox GL (which needs WebGL and a real browser). It records the
// handlers the quiz registers so the test can fire them like the real map would.
const mock = vi.hoisted(() => ({ map: null, popups: [] }));

vi.mock("mapbox-gl", () => {
  class FakeMap {
    constructor(opts) {
      this.opts = opts;
      this.handlers = {};
      this.features = [];
      this.removed = false;
      this.source = { setData: vi.fn() };
      this.touchPitch = { disable() {} };
      this.touchZoomRotate = { enable() {}, disableRotation() {} };
      mock.map = this;
    }
    on(event, a, b) {
      this.handlers[typeof a === "string" ? `${event}:${a}` : event] = typeof a === "string" ? b : a;
    }
    addSource() {}
    addLayer() {}
    getSource() { return this.source; }
    querySourceFeatures() { return this.features; }
    setFeatureState() {}
    setPaintProperty() {}
    flyTo() {}
    remove() { this.removed = true; }
  }
  class FakePopup {
    constructor() { mock.popups.push(this); }
    setLngLat() { return this; }
    setHTML(html) { this.html = html; return this; }
    addTo() { return this; }
    remove() {}
  }
  return { default: { Map: FakeMap, Popup: FakePopup, accessToken: "" } };
});

import App from "./App.jsx";
import { navigate } from "./router.js";

const settle = async () => {
  for (let i = 0; i < 6; i++) {
    await new Promise((r) => setTimeout(r, 10));
    flush();
  }
};

let root;
let dispose;

beforeEach(async () => {
  vi.stubEnv("VITE_MAPBOX_ACCESS_TOKEN", "pk.test");
  mock.map = null;
  mock.popups = [];
  root = document.createElement("div");
  document.body.appendChild(root);
  navigate("/quiz");
  dispose = render(() => <App />, root);
  // the quiz page is lazy-loaded: wait for its chunk instead of guessing a delay
  for (let i = 0; i < 100 && !mock.map; i++) await settle();
});

afterEach(() => {
  dispose();
  root.remove();
  vi.unstubAllEnvs();
});

const button = (text) => [...root.querySelectorAll("button")].find((b) => b.textContent.includes(text));
const questionName = () => root.textContent.match(/Where is (.+?)\?/)?.[1];

describe("quiz page", () => {
  it("creates the map with the token and shows the start buttons", () => {
    expect(mock.map).not.toBeNull();
    expect(root.textContent).toContain("Start Countries Quiz");
    expect(root.textContent).toContain("Start Seattle Neighborhood Quiz");
  });

  it("starts the countries quiz and asks a question", async () => {
    mock.map.handlers.load();
    button("Start Countries Quiz").click();
    await settle();
    expect(mock.map.source.setData).toHaveBeenCalled();
    // The total comes from the data (176 countries), not a hard-coded number.
    expect(root.textContent).toContain("Question 1 of 176");
    expect(questionName()).toBeTruthy();
  });

  it("scores a correct click and moves to the next question", async () => {
    mock.map.handlers.load();
    button("Start Countries Quiz").click();
    await settle();

    const first = questionName();
    mock.map.features = [{ id: 7, properties: { name: first } }];
    mock.map.handlers["click:map-fill"]({ features: [{ id: 7 }], lngLat: { lng: 0, lat: 0 } });
    await settle();

    expect(root.textContent).toContain("Correct!");
    expect(root.textContent).toContain("Question 2 of 176");
    expect(root.textContent).toContain("Score: 100%");
    expect(questionName()).not.toBe(first);
  });

  it("shows 'Incorrect' for a wrong click", async () => {
    mock.map.handlers.load();
    button("Start Countries Quiz").click();
    await settle();

    // Pick a country that has fly-to coordinates and is not the current question.
    const wrong = questionName() === "France" ? "Spain" : "France";
    mock.map.features = [{ id: 3, properties: { name: wrong } }];
    mock.map.handlers["click:map-fill"]({ features: [{ id: 3 }], lngLat: { lng: 0, lat: 0 } });
    await settle();

    expect(root.textContent).toContain("Incorrect :(");
    expect(root.textContent).toContain("Score: 0%");
  });

  it("handles a wrong answer when the question is a country that used to have no position", async () => {
    mock.map.handlers.load();
    button("Start Countries Quiz").click();
    await settle();

    // Skip ahead until the question is Kosovo (it had no fly-to entry before the fix).
    for (let i = 0; i < 200 && questionName() !== "Kosovo"; i++) {
      button("Skip Question").click();
      flush();
    }
    expect(questionName()).toBe("Kosovo");

    mock.map.features = [{ id: 3, properties: { name: "France" } }];
    mock.map.handlers["click:map-fill"]({ features: [{ id: 3 }], lngLat: { lng: 0, lat: 0 } });
    await settle();

    expect(root.textContent).toContain("Incorrect :(");
    // The popup that points at the right answer was created, so the lookup worked.
    expect(mock.popups.some((p) => p.html === "Kosovo")).toBe(true);
  });

  it("shows the completion popup after every country is answered correctly", async () => {
    mock.map.handlers.load();
    button("Start Countries Quiz").click();
    await settle();

    for (let i = 0; i < 176; i++) {
      const name = questionName();
      expect(name, `question ${i + 1}`).toBeTruthy();
      mock.map.features = [{ id: 1, properties: { name } }];
      mock.map.handlers["click:map-fill"]({ features: [{ id: 1 }], lngLat: { lng: 0, lat: 0 } });
      flush();
    }
    await settle();

    expect(root.textContent).toContain("Quiz Completed!");
    expect(root.textContent).toContain("Score: 100%");
  });

  it("removes the map when leaving the page", async () => {
    const map = mock.map;
    navigate("/");
    await settle();
    expect(map.removed).toBe(true);
  });
});

describe("quiz page without a token", () => {
  it("does not start the map and reveals nothing about the setup on the page", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    dispose();
    root.innerHTML = "";
    vi.stubEnv("VITE_MAPBOX_ACCESS_TOKEN", "");
    mock.map = null;
    navigate("/quiz");
    dispose = render(() => <App />, root);
    await settle();
    expect(mock.map).toBeNull();
    expect(consoleError).toHaveBeenCalled(); // the reason goes to the console only
    const text = root.textContent.toLowerCase();
    for (const secret of ["token", "env", "mapbox", "npm"]) expect(text).not.toContain(secret);
    expect(root.querySelector('a[href="/"]')).not.toBeNull(); // back link still there
    consoleError.mockRestore();
  });
});
