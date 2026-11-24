import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MeasurementSliderPanel from "./MeasurementSliderPanel.jsx";

describe("MeasurementSliderPanel", () => {
  test("shirt renders only shirt fields, excluding thigh/knee", () => {
    render(
      <MeasurementSliderPanel dressType="shirt" values={{}} estimated={null} onChange={() => {}} />
    );
    expect(screen.getByLabelText(/^chest$/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/^thigh$/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^knee$/i)).not.toBeInTheDocument();
  });

  test("pant renders only pant fields, excluding neck/chest", () => {
    render(
      <MeasurementSliderPanel dressType="pant" values={{}} estimated={null} onChange={() => {}} />
    );
    expect(screen.getByLabelText(/^thigh$/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/^neck$/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^chest$/i)).not.toBeInTheDocument();
  });

  test("falls back to the estimate and shows the estimated label when no value is stored", () => {
    render(
      <MeasurementSliderPanel
        dressType="shirt"
        values={{}}
        estimated={{ chest: 42 }}
        onChange={() => {}}
      />
    );
    expect(screen.getByLabelText(/^chest$/i)).toHaveValue(42);
    expect(screen.getAllByText("estimated — adjust to match you")).toHaveLength(1);
  });

  test("a stored value takes precedence over the estimate and shows no label", () => {
    render(
      <MeasurementSliderPanel
        dressType="shirt"
        values={{ chest: 40 }}
        estimated={{ chest: 42 }}
        onChange={() => {}}
      />
    );
    expect(screen.getByLabelText(/^chest$/i)).toHaveValue(40);
    expect(screen.queryByText(/estimated/)).not.toBeInTheDocument();
  });

  test("moving a field calls onChange and clears only that field's estimated label", () => {
    const onChange = vi.fn();
    render(
      <MeasurementSliderPanel
        dressType="shirt"
        values={{}}
        estimated={{ chest: 42, waist: 36 }}
        onChange={onChange}
      />
    );
    expect(screen.getAllByText("estimated — adjust to match you")).toHaveLength(2);

    fireEvent.change(screen.getByLabelText(/^chest$/i), { target: { value: "44" } });

    expect(onChange).toHaveBeenCalledWith("chest", 44);
    expect(screen.getAllByText("estimated — adjust to match you")).toHaveLength(1);
  });

  test("estimated: null renders plain empty inputs with no estimated label and no crash", () => {
    render(
      <MeasurementSliderPanel dressType="shirt" values={{}} estimated={null} onChange={() => {}} />
    );
    expect(screen.getByLabelText(/^chest$/i)).toHaveValue(null);
    expect(screen.queryByText(/estimated/)).not.toBeInTheDocument();
  });
});
