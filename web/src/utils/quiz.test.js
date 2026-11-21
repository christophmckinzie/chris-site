import { describe, expect, it } from "vitest";
import { flyToCoords, scorePercent, shuffleNames } from "./quiz.js";
import { getRandomIntInclusive, moveElement } from "./helpers.js";
import countries from "../data/world-countries.json";
import neighborhoods from "../data/seattle_neighborhoods_with_centroid.json";

describe("scorePercent", () => {
  it("is 0 before anything is asked or when nothing is correct", () => {
    expect(scorePercent(0, 0)).toBe(0);
    expect(scorePercent(0, 5)).toBe(0);
  });
  it("rounds to a whole percent", () => {
    expect(scorePercent(1, 3)).toBe(33);
    expect(scorePercent(2, 3)).toBe(67);
    expect(scorePercent(4, 4)).toBe(100);
  });
});

describe("shuffleNames", () => {
  it("keeps every name and does not change the input", () => {
    const input = ["a", "b", "c", "d", "e"];
    const out = shuffleNames(input);
    expect(out).not.toBe(input);
    expect([...out].sort()).toEqual([...input].sort());
    expect(input).toEqual(["a", "b", "c", "d", "e"]);
  });
});

describe("moveElement", () => {
  it("moves the first element to the given index", () => {
    expect(moveElement(["a", "b", "c", "d"], 2)).toEqual(["b", "c", "a", "d"]);
  });
  it("leaves the array alone for an out-of-range index", () => {
    expect(moveElement(["a", "b"], 5)).toEqual(["a", "b"]);
  });
});

describe("getRandomIntInclusive", () => {
  it("stays within the bounds", () => {
    for (let i = 0; i < 200; i++) {
      const n = getRandomIntInclusive(-3, 3);
      expect(n).toBeGreaterThanOrEqual(-3);
      expect(n).toBeLessThanOrEqual(3);
    }
  });
});

describe("flyToCoords", () => {
  it("returns [longitude, latitude]", () => {
    const [lng, lat] = flyToCoords("France");
    expect(lng).toBeGreaterThan(-10);
    expect(lng).toBeLessThan(15);
    expect(lat).toBeGreaterThan(40);
    expect(lat).toBeLessThan(52);
  });

  it("finds countries the quiz names differently from the coordinates file", () => {
    for (const name of ["The Bahamas", "Republic of the Congo", "Republic of Serbia", "United Republic of Tanzania"]) {
      expect(flyToCoords(name), name).not.toBeNull();
    }
  });

  it("covers countries that have no entry in the coordinates file", () => {
    const [lng, lat] = flyToCoords("Kosovo");
    expect(lng).toBeCloseTo(20.9, 0);
    expect(lat).toBeCloseTo(42.6, 0);
    for (const name of ["South Sudan", "Somaliland", "Vanuatu", "Northern Cyprus", "West Bank"]) {
      expect(flyToCoords(name), name).not.toBeNull();
    }
  });

  it("has a valid position for every country in the quiz", () => {
    for (const { properties } of countries.features) {
      const found = flyToCoords(properties.name);
      expect(found, properties.name).not.toBeNull();
      const [lng, lat] = found;
      expect(Math.abs(lng)).toBeLessThanOrEqual(180);
      expect(Math.abs(lat)).toBeLessThanOrEqual(90);
    }
  });

  it("returns null for a name it does not know", () => {
    expect(flyToCoords("Atlantis")).toBeNull();
  });
});

describe("quiz data", () => {
  it("gives every neighborhood a centroid to fly to", () => {
    expect(neighborhoods.features.length).toBeGreaterThan(0);
    for (const { properties } of neighborhoods.features) {
      expect(properties.centroid, properties.name).toBeTruthy();
    }
  });
});
