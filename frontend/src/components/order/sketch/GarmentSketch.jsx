import ShirtSketch from "./ShirtSketch.jsx";
import PantSketch from "./PantSketch.jsx";

// PanjabiSketch/SuitSketch/PaijamaSketch exist but are NOT wired in below:
// their art is 100% placeholder reused from other garments (e.g. suit's
// double_breasted renders a pant-leg silhouette), which would show the
// wrong garment confidently instead of a "coming soon" placeholder. Keep
// them out of this lookup — and out of real use — until real art replaces
// the placeholders in those files (see the comment at the top of each).
const SKETCH_BY_DRESS_TYPE = {
  shirt: ShirtSketch,
  pant: PantSketch,
};

export default function GarmentSketch(props) {
  // hasOwn stops inherited keys like "constructor" from being treated as components.
  const Sketch = Object.hasOwn(SKETCH_BY_DRESS_TYPE, props.dressType) ? SKETCH_BY_DRESS_TYPE[props.dressType] : null;
  if (Sketch) return <Sketch {...props} />;

  const label = props.dressType ? `${props.dressType[0].toUpperCase()}${props.dressType.slice(1)}` : "Garment";
  return (
    <div className="mx-auto flex aspect-[16/9] w-full max-w-xl items-center justify-center text-sm text-stone-500">
      {label} sketch coming soon
    </div>
  );
}
