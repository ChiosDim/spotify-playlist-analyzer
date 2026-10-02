import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function GenreChart({ topGenres }) {
  if (!topGenres || topGenres.length === 0) {
    return <p className="text-sm text-base-content/60 py-4">No genre data available.</p>;
  }
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart data={topGenres} layout="vertical" margin={{ left: 20, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis type="number" />
          <YAxis type="category" dataKey="genre" width={120} tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value) => [`${value}`, "Count"]}
            contentStyle={{ borderRadius: 8, border: "none" }}
          />
          <Bar dataKey="count" fill="#1DB954" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
