import { describe, it, expect } from "@jest/globals";
import { parseCSV } from "../services/parserService.js";

const HEADER =
  "Track URI,Track Name,Artist Names,Album Name,Duration (ms),Popularity,Explicit,Danceability,Energy,Tempo";

const ROW_A = "spotify:track:1,Song A,Artist A,Album A,180000,50,false,0.5,0.6,120";
const ROW_B = "spotify:track:2,Song B,Artist B,Album B,200000,60,true,0.7,0.8,130";

describe("parseCSV", () => {
  it("returns a Track for each valid row", async () => {
    const buf = Buffer.from(`${HEADER}\n${ROW_A}\n${ROW_B}\n`);
    const tracks = await parseCSV(buf);
    expect(tracks).toHaveLength(2);
    expect(tracks[0].name).toBe("Song A");
    expect(tracks[0].tempo).toBe(120);
    expect(tracks[1].explicit).toBe(true);
  });

  it("skips rows missing required fields", async () => {
    const badRow = ",,,Album,1000,10,false,0.1,0.1,100";
    const buf = Buffer.from(`${HEADER}\n${ROW_A}\n${badRow}\n${ROW_B}\n`);
    const tracks = await parseCSV(buf);
    expect(tracks).toHaveLength(2);
  });

  it("handles missing optional columns gracefully", async () => {
    const minimalHeader = "Track URI,Track Name,Artist Names";
    const row = "spotify:track:9,Name,Artist";
    const buf = Buffer.from(`${minimalHeader}\n${row}\n`);
    const tracks = await parseCSV(buf);
    expect(tracks).toHaveLength(1);
    expect(tracks[0].tempo).toBe(0);
    expect(tracks[0].danceability).toBe(0);
  });

  it("rejects an empty buffer", async () => {
    await expect(parseCSV(Buffer.alloc(0))).rejects.toThrow(/Empty CSV buffer/);
  });

  it("rejects a CSV with only a header and no rows", async () => {
    const buf = Buffer.from(`${HEADER}\n`);
    await expect(parseCSV(buf)).rejects.toThrow(/no data rows/);
  });
});
