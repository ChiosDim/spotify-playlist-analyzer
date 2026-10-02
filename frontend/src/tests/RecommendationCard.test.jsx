import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import RecommendationCard from "../components/RecommendationCard";

describe("RecommendationCard", () => {
  it("renders track name, artist, and score", () => {
    const rec = {
      track: { name: "Sunrise", artists: "Artist A" },
      reason: "due to similar energy",
      similarityScore: 0.87,
    };
    render(<RecommendationCard rec={rec} />);
    expect(screen.getByText("Sunrise")).toBeInTheDocument();
    expect(screen.getByText("Artist A")).toBeInTheDocument();
    expect(screen.getByText("0.87")).toBeInTheDocument();
  });
});
