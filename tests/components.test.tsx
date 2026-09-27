import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProjectExplorer } from "@/components/project-explorer";
import { projects } from "@/content/projects";

describe("ProjectExplorer", () => {
  it("renders all projects and usable filters", () => { render(<ProjectExplorer projects={projects} />); expect(screen.getByRole("searchbox", { name: "Filter projects" })).toBeInTheDocument(); expect(screen.getByText("Payment Platform")).toBeInTheDocument(); });
});
