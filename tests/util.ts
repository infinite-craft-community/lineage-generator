import type { Step } from "#lib/infinibrowser/shared";

function stepToString(step: Step) {
  return `${step[0].text} + ${step[1].text} = ${step[2].text}`;
}

export function toLineageString(lineage: Step[]): string {
  return lineage.map(stepToString).join("\n");
}
