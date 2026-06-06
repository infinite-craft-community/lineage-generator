import { describe, it, expect } from "bun:test";

import { loadFixture } from "@savefile/fixtures";
import { Savefile } from "savefile.js";

import { generateLineage } from "#lib/infinibrowser";

import { toLineageString } from "./util";

describe("generateLineage", () => {
  describe("2024-10-18.json savefile", async () => {
    const raw = loadFixture("2024-10-18.json");
    // @ts-expect-error should be not null
    const savefile: Savefile = await Savefile.decode(raw);

    it("should generate a lineage for 'Plural'", async () => {
      const { lineage, missing } = await generateLineage(
        savefile.elementNames.get("Plural")!,
        savefile.elements,
      );
      expect(missing).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`24`);
      expect(toLineageString(lineage)).toMatchSnapshot();
    });

    it("should generate a lineage for 'Detective'", async () => {
      const { lineage, missing } = await generateLineage(
        savefile.elementNames.get("Detective")!,
        savefile.elements,
      );
      expect(missing).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`299`);
      expect(toLineageString(lineage)).toMatchSnapshot();
    });
  });

  describe("2025-04-04.ic savefile", async () => {
    const raw = loadFixture("2025-04-04.ic");
    // @ts-expect-error should be not null
    const savefile: Savefile = await Savefile.decode(raw);

    it("should generate a lineage for 'Plural'", async () => {
      const { lineage, missing } = await generateLineage(
        savefile.elementNames.get("Plural")!,
        savefile.elements,
      );
      expect(missing).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`24`);
      expect(toLineageString(lineage)).toMatchSnapshot();
    });

    it("should generate a lineage for 'Detective'", async () => {
      const { lineage, missing } = await generateLineage(
        savefile.elementNames.get("Detective")!,
        savefile.elements,
      );
      expect(missing).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`222`);
      expect(toLineageString(lineage)).toMatchSnapshot();
    });
  });
});
