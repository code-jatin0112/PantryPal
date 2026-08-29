import { describe, it, expect } from "vitest";
import {
  normalizeIngredientName,
  findUnitGroup,
  normalizeQuantity,
  convertUnitQuantity,
  compareIngredientQuantity,
} from "../../src/utils/ingredientMatcher.js";

describe("ingredientMatcher Unit Tests", () => {
  describe("normalizeIngredientName", () => {
    it("trims and lowercases names", () => {
      expect(normalizeIngredientName("  Fresh Garlic Cloves  ")).toBe("fresh garlic cloves");
      expect(normalizeIngredientName("MILK")).toBe("milk");
      expect(normalizeIngredientName(null)).toBe("");
    });
  });

  describe("findUnitGroup", () => {
    it("identifies weight units", () => {
      expect(findUnitGroup("g")).toEqual({ group: "weight", multiplier: 1 });
      expect(findUnitGroup("kg")).toEqual({ group: "weight", multiplier: 1000 });
      expect(findUnitGroup("grams")).toEqual({ group: "weight", multiplier: 1 });
      expect(findUnitGroup("lbs")).toEqual({ group: "weight", multiplier: 453.592 });
    });

    it("identifies volume units", () => {
      expect(findUnitGroup("ml")).toEqual({ group: "volume", multiplier: 1 });
      expect(findUnitGroup("l")).toEqual({ group: "volume", multiplier: 1000 });
      expect(findUnitGroup("liter")).toEqual({ group: "volume", multiplier: 1000 });
      expect(findUnitGroup("tbsp")).toEqual({ group: "volume", multiplier: 14.7868 });
    });

    it("identifies count units", () => {
      expect(findUnitGroup("piece")).toEqual({ group: "count", multiplier: 1 });
      expect(findUnitGroup("clove")).toEqual({ group: "count", multiplier: 1 });
      expect(findUnitGroup("can")).toEqual({ group: "count", multiplier: 1 });
    });

    it("returns null for unknown units", () => {
      expect(findUnitGroup("unknown-unit")).toBeNull();
      expect(findUnitGroup(null)).toBeNull();
    });
  });

  describe("convertUnitQuantity", () => {
    it("converts identical units directly", () => {
      expect(convertUnitQuantity(500, "g", "g")).toBe(500);
      expect(convertUnitQuantity(2, "cups", "cups")).toBe(2);
    });

    it("converts grams to kilograms (g -> kg)", () => {
      expect(convertUnitQuantity(500, "g", "kg")).toBeCloseTo(0.5);
      expect(convertUnitQuantity(1500, "grams", "kilogram")).toBeCloseTo(1.5);
    });

    it("converts kilograms to grams (kg -> g)", () => {
      expect(convertUnitQuantity(2, "kg", "g")).toBeCloseTo(2000);
      expect(convertUnitQuantity(0.25, "kilograms", "grams")).toBeCloseTo(250);
    });

    it("converts milliliters to liters (ml -> l)", () => {
      expect(convertUnitQuantity(750, "ml", "l")).toBeCloseTo(0.75);
      expect(convertUnitQuantity(250, "milliliters", "liter")).toBeCloseTo(0.25);
    });

    it("converts liters to milliliters (l -> ml)", () => {
      expect(convertUnitQuantity(1.5, "l", "ml")).toBeCloseTo(1500);
    });

    it("converts tablespoons to teaspoons (tbsp -> tsp)", () => {
      // 1 tbsp = ~3 tsp
      expect(convertUnitQuantity(1, "tbsp", "tsp")).toBeCloseTo(3, 1);
    });

    it("returns null for cross-group incompatible units", () => {
      expect(convertUnitQuantity(500, "g", "ml")).toBeNull();
      expect(convertUnitQuantity(2, "pieces", "kg")).toBeNull();
      expect(convertUnitQuantity(1, "liter", "piece")).toBeNull();
    });

    it("returns null for invalid numbers", () => {
      expect(convertUnitQuantity(NaN, "g", "kg")).toBeNull();
      expect(convertUnitQuantity("500", "g", "kg")).toBeNull();
    });
  });

  describe("compareIngredientQuantity", () => {
    it("correctly compares same units", () => {
      expect(
        compareIngredientQuantity({
          requiredQuantity: 200,
          requiredUnit: "g",
          availableQuantity: 500,
          availableUnit: "g",
        })
      ).toEqual({ comparable: true, sufficient: true });

      expect(
        compareIngredientQuantity({
          requiredQuantity: 600,
          requiredUnit: "g",
          availableQuantity: 500,
          availableUnit: "g",
        })
      ).toEqual({ comparable: true, sufficient: false });
    });

    it("correctly compares cross-unit compatible quantities", () => {
      // 500g required vs 1kg available -> sufficient
      expect(
        compareIngredientQuantity({
          requiredQuantity: 500,
          requiredUnit: "g",
          availableQuantity: 1,
          availableUnit: "kg",
        })
      ).toEqual({ comparable: true, sufficient: true });

      // 1.5kg required vs 1000g available -> insufficient
      expect(
        compareIngredientQuantity({
          requiredQuantity: 1.5,
          requiredUnit: "kg",
          availableQuantity: 1000,
          availableUnit: "g",
        })
      ).toEqual({ comparable: true, sufficient: false });
    });

    it("returns non-comparable for incompatible units", () => {
      expect(
        compareIngredientQuantity({
          requiredQuantity: 500,
          requiredUnit: "g",
          availableQuantity: 1,
          availableUnit: "l",
        })
      ).toEqual({ comparable: false, sufficient: false });
    });
  });
});
