const STATUS_STYLES = {
  requested: "bg-slate-100 text-slate-700",
  needs_changes: "bg-amber-100 text-amber-800",
  quoted: "bg-blue-100 text-blue-800",
  declined: "bg-red-100 text-red-700",
  confirmed: "bg-emerald-100 text-emerald-800",
  cutting: "bg-indigo-100 text-indigo-800",
  stitching: "bg-indigo-100 text-indigo-800",
  ready: "bg-emerald-100 text-emerald-800",
  completed: "bg-slate-200 text-slate-700",
};

function OrderStatusBadge({ status }) {
  const style = STATUS_STYLES[status] || "bg-slate-100 text-slate-700";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export default OrderStatusBadge;
