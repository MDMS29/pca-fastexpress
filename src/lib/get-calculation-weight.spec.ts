import { describe, expect, it } from "vitest";
import { getCalculationWeight } from "./get-calculation-weight";

describe("getCalculationWeight - análisis de valores límite", () => {
  it.each([
    [-1, null],
    [0, null],
    [0.01, null],
    [0.0101, 2],
    [5, 2],
    [5.0001, 4],
    [20, 4],
    [20.0001, null],
  ])("devuelve %s para un peso de %s kg", (weight, expectedRate) => {
    expect(getCalculationWeight(weight)).toBe(expectedRate);
  });
});
