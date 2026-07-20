import { loadFixture } from "@savefile/fixtures";
import { run, bench, summary, boxplot, do_not_optimize } from "mitata";
import { Savefile } from "savefile.js";

import { loadFromSavefile as loadCatstone } from "#lib/catstone";
import { loadFromSavefile as loadHybrid } from "#lib/hybrid";
import { calculateElementDepths } from "#lib/infinibrowser";

const savefiles = [
  "2024-10-18.json",
  "2025-04-04.ic",
  "catstone-2026-06-06.ic",
] as const;

const allResults: string[] = [];

for (const savefileName of savefiles) {
  const raw = loadFixture(savefileName);
  // @ts-expect-error should be not null
  const savefile: Savefile = await Savefile.decode(raw);
  const elements = savefile.elements;

  let output = "";
  const print = (s: string) => {
    console.log(s);
    output += s + "\n";
  };

  print(`\n=== ${savefileName} ===\n`);

  boxplot(() => {
    summary(() => {
      bench("catstone init", () => {
        do_not_optimize(loadCatstone(elements));
      });
      bench("hybrid init", () => {
        do_not_optimize(loadHybrid(elements));
      });
      bench("infinibrowser init", async () => {
        do_not_optimize(await calculateElementDepths(elements));
      });
    });
  });

  await run({ print, colors: false });
  allResults.push(`=== ${savefileName} ===\n${output}`);
}

await Bun.write(
  `benchmarks/results/init-${Date.now()}.txt`,
  allResults.join("\n"),
);
