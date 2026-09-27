import mermaid from "mermaid";
import { projects } from "../content/projects";

async function main() {
  const expectedDiagramCount = 30;
  const failures: string[] = [];
  let validated = 0;

  for (const project of projects) {
    for (const [kind, chart] of Object.entries(project.diagrams)) {
      try {
        await mermaid.parse(chart);
        validated += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failures.push(`${project.slug}/${kind}: ${message}`);
      }
    }
  }

  if (failures.length > 0) {
    throw new Error(`Invalid Mermaid diagrams:\n${failures.join("\n")}`);
  }

  if (validated !== expectedDiagramCount) {
    throw new Error(`Expected ${expectedDiagramCount} Mermaid diagrams, validated ${validated}`);
  }

  console.log(`Mermaid valid: ${validated} diagrams across ${projects.length} projects.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
