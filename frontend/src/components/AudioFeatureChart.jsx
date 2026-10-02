import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatNumber } from "../utils/formatters";

const LABELS = {
  danceability: "Danceability",
  energy: "Energy",
  speechiness: "Speechiness",
  acousticness: "Acousticness",
  instrumentalness: "Instrumentalness",
  liveness: "Liveness",
  valence: "Valence",
};

export default function AudioFeatureChart({ audioFeatures }) {
  if (!audioFeatures) return null;

  const data = Object.entries(LABELS).map(([key, label]) => ({
    feature: label,
    mean: Number(formatNumber(audioFeatures[key]?.mean ?? 0, 3)),
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ left: 0, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis
            dataKey="feature"
            tick={{ fontSize: 11 }}
            angle={-20}
            textAnchor="end"
            height={60}
          />
          <YAxis domain={[0, 1]} />
          <Tooltip contentStyle={{ borderRadius: 8, border: "none" }} />
          <Bar dataKey="mean" fill="#1ed760" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
