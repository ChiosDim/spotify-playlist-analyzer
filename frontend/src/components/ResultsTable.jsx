import { truncate } from "../utils/formatters";

export default function ResultsTable({ rows, columns }) {
  if (!rows || rows.length === 0) {
    return <p className="text-sm text-base-content/60 py-4">No results.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="table table-zebra">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td key={c.key}>{c.render ? c.render(row) : truncate(String(row[c.key] ?? ""))}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
