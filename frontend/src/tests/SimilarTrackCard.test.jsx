import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SimilarTrackCard from "../components/SimilarTrackCard";

const pair = {
  source: { name: "Sunrise", artists: "Artist A" },
  match: { name: "Two Birds", artists: "Regina Spektor" },
  reason: "similar danceability, energy, valence",
  similarityScore: 0.87,
};

describe("SimilarTrackCard", () => {
  it("renders both the source and match tracks", () => {
    render(<SimilarTrackCard pair={pair} />);
    expect(screen.getByText("Sunrise")).toBeInTheDocument();
    expect(screen.getByText("Artist A")).toBeInTheDocument();
    expect(screen.getByText("Two Birds")).toBeInTheDocument();
    expect(screen.getByText("Regina Spektor")).toBeInTheDocument();
  });

  it("renders the similarity score with two decimal places", () => {
    render(<SimilarTrackCard pair={pair} />);
    expect(screen.getByText("0.87")).toBeInTheDocument();
  });

  it("renders the reason text", () => {
    render(<SimilarTrackCard pair={pair} />);
    expect(screen.getByText(/similar danceability, energy, valence/)).toBeInTheDocument();
  });

  it("shows labels for source and match sections", () => {
    render(<SimilarTrackCard pair={pair} />);
    expect(screen.getByText(/source track/i)).toBeInTheDocument();
    expect(screen.getByText(/^match$/i)).toBeInTheDocument();
  });
});
