import ShirtSketch from "./ShirtSketch.jsx";
import PantSketch from "./PantSketch.jsx";
import PanjabiSketch from "./PanjabiSketch.jsx";
import SuitSketch from "./SuitSketch.jsx";
import PaijamaSketch from "./PaijamaSketch.jsx";

// Every planned garment now has a sketch component; an unrecognized
// dressType (or one added here without a component yet) falls through to
// the "coming soon" placeholder below.
const SKETCH_BY_DRESS_TYPE = {
  shirt: ShirtSketch,
  pant: PantSketch,
  panjabi: PanjabiSketch,
  suit: SuitSketch,
  paijama: PaijamaSketch,
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
