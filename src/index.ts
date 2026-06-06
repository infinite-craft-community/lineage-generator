import { loadFixture } from "@savefile/fixtures";
import { Savefile } from "savefile.js";

import { calculateElementDepths } from "./lib/infinibrowser";

const raw = loadFixture("catstone-2026-06-06.ic");

const savefile = (await Savefile.decode(raw))!;
const { generateLineage } = await calculateElementDepths(savefile.elements);

await generateLineage(savefile.elementNames.get("Plural")!);
await generateLineage(savefile.elementNames.get("Detective")!);
