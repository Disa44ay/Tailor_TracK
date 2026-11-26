import { describe, test, expect } from "vitest";
import { render } from "@testing-library/react";
import FitStatement from "./FitStatement.jsx";

describe("FitStatement", () => {
  test("shows no visible On fit label", () => {
    const { container } = render(<FitStatement />);
    expect(container.querySelector(".t-label")).toBeNull();
  });
});
