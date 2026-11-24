import { describe, test, expect, beforeEach } from "vitest";
import { getBodyProfileMock, setBodyProfileMock } from "./bodyProfileMock.js";

describe("bodyProfileMock", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("returns an empty object when nothing has been saved", () => {
    expect(getBodyProfileMock()).toEqual({});
  });

  test("round-trips saved values", () => {
    setBodyProfileMock({ height: 178, weight: 72, age: 29 });
    expect(getBodyProfileMock()).toEqual({ height: 178, weight: 72, age: 29 });
  });

  test("returns an empty object if the stored value is corrupt JSON", () => {
    localStorage.setItem("tailor-track:body-profile-mock", "{not json");
    expect(getBodyProfileMock()).toEqual({});
  });
});
