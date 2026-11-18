import { useEffect, useState } from "react";
import { apiFetch } from "../api/client.js";

function AdminReports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/admin/reports")
      .then(setReport)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <main className="p-8 text-slate-500">Loading…</main>;
  if (!report) return null;

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-xl font-semibold text-slate-900">Reports</h1>

      <h2 className="mt-6 font-medium text-slate-900">Orders by status</h2>
      <table className="mt-2 w-full text-sm">
        <tbody>
          {Object.entries(report.ordersByStatus).map(([status, count]) => (
            <tr key={status} className="border-b border-slate-100">
              <td className="py-1.5 capitalize">{status.replace(/_/g, " ")}</td>
              <td className="py-1.5 text-right">{count}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="mt-6 font-medium text-slate-900">Totals</h2>
      <table className="mt-2 w-full text-sm">
        <tbody>
          <tr className="border-b border-slate-100">
            <td className="py-1.5">Collected</td>
            <td className="py-1.5 text-right">৳{report.totals.collected}</td>
          </tr>
          <tr className="border-b border-slate-100">
            <td className="py-1.5">Outstanding</td>
            <td className="py-1.5 text-right">৳{report.totals.outstanding}</td>
          </tr>
        </tbody>
      </table>
    </main>
  );
}

export default AdminReports;
