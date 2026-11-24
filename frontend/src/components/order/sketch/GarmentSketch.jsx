import ShirtSketch from "./ShirtSketch.jsx";

// null entries are garments whose sketch component lands in a later task.
// Replacing a null with the real component is the only change needed per garment.
const SKETCH_BY_DRESS_TYPE = {
  shirt: ShirtSketch,
  pant: null,
  panjabi: null,
  suit: null,
  paijama: null,
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
