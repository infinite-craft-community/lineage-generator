import { loadFixture } from "@savefile/fixtures";
import { run, bench, summary, boxplot, do_not_optimize } from "mitata";
import { Savefile } from "savefile.js";

import { loadFromSavefile as loadCatstone } from "#lib/catstone";

const savefiles = [
  "2024-10-18.json",
  "2025-04-04.ic",
  "catstone-2026-06-06.ic",
] as const;
const targets = ["Plural", "Detective", "Acronym", "Soul"] as const;
const multiTargets = [
  ["Plural", "Soul"],
  ["Plural", "Detective", "Acronym"],
] as const;

const allResults: string[] = [];

for (const savefileName of savefiles) {
  const raw = loadFixture(savefileName);
  // @ts-expect-error should be not null
  const savefile: Savefile = await Savefile.decode(raw);

  const catstone = loadCatstone(savefile.elements);

  let output = "";
  const print = (s: string) => {
    console.log(s);
    output += s + "\n";
  };

  print(`\n=== ${savefileName} ===\n`);

  boxplot(() => {
    for (const target of targets) {
      summary(() => {
        bench(`catstone ${target}`, async () => {
          do_not_optimize(await catstone.generateLineage(target));
        });
      });
    }

    for (const targetList of multiTargets) {
      const label = targetList.join("+");
      summary(() => {
        bench(`catstone ${label}`, async () => {
          do_not_optimize(await catstone.generateLineage(targetList));
        });
      });
    }
  });

  await run({ print, colors: false });
  allResults.push(`=== ${savefileName} ===\n${output}`);
}

await Bun.write(
  `benchmarks/results/catstone-${Date.now()}.txt`,
  allResults.join("\n"),
);
