import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import FileUpload from "../components/FileUpload";

describe("FileUpload", () => {
  it("calls onUpload with the selected file", () => {
    const onUpload = vi.fn();
    render(<FileUpload onUpload={onUpload} />);
    const file = new File(["dummy"], "test.csv", { type: "text/csv" });
    const input = document.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: /Upload & Analyze/i }));
    expect(onUpload).toHaveBeenCalledWith(file);
  });
});
