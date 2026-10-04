import type { TopicInfo } from "../api.js";

export function TopicsTable({
  topics,
  error,
}: {
  topics: TopicInfo[] | null;
  error: string | null;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Topics</h2>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!error && !topics && <p className="text-sm text-slate-400">Loading…</p>}
      {!error && topics && topics.length === 0 && (
        <p className="text-sm text-slate-400">No topics on the broker yet.</p>
      )}
      {!error && topics && topics.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400">
              <th className="py-1 font-medium">Name</th>
              <th className="py-1 font-medium">Partitions</th>
              <th className="py-1 font-medium">Replicas</th>
            </tr>
          </thead>
          <tbody>
            {topics.map((topic) => (
              <tr key={topic.name} className="border-t border-slate-100">
                <td className="py-1.5 font-mono text-slate-800">{topic.name}</td>
                <td className="py-1.5 text-slate-600">{topic.partitions}</td>
                <td className="py-1.5 text-slate-600">{topic.replicas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
