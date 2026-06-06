import { describe, it, expect } from "bun:test";

import { loadFixture } from "@savefile/fixtures";
import { Savefile } from "savefile.js";

import { calculateElementDepths } from "#lib/infinibrowser/alternative-depth-calculation";

import { toLineageString } from "./util";

describe("generateLineage", () => {
  describe("2024-10-18.json savefile", async () => {
    const raw = loadFixture("2024-10-18.json");
    // @ts-expect-error should be not null
    const savefile: Savefile = await Savefile.decode(raw);
    const { generateLineage } = await calculateElementDepths(savefile.elements);

    it("should generate a lineage for 'Plural'", async () => {
      const { lineage, missing } = await generateLineage(
        savefile.elementNames.get("Plural")!,
      );
      expect(missing).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`24`);
      expect(toLineageString(lineage)).toMatchSnapshot();
    });

    it("should generate a lineage for 'Detective'", async () => {
      const { lineage, missing } = await generateLineage(
        savefile.elementNames.get("Detective")!,
      );
      expect(missing).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`270`);
      expect(toLineageString(lineage)).toMatchSnapshot();
    });

    it("should generate a lineage for 'Acronym'", async () => {
      const { lineage, missing } = await generateLineage(
        savefile.elementNames.get("Acronym")!,
      );
      expect(missing).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`183`);
      expect(toLineageString(lineage)).toMatchSnapshot();
    });

    it("should generate a lineage for 'Soul'", async () => {
      const { lineage, missing } = await generateLineage(
        savefile.elementNames.get("Soul")!,
      );
      expect(missing).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`63`);
      expect(toLineageString(lineage)).toMatchSnapshot();
    });
  });

  describe("2025-04-04.ic savefile", async () => {
    const raw = loadFixture("2025-04-04.ic");
    // @ts-expect-error should be not null
    const savefile: Savefile = await Savefile.decode(raw);
    const { generateLineage } = await calculateElementDepths(savefile.elements);

    it("should generate a lineage for 'Plural'", async () => {
      const { lineage, missing } = await generateLineage(
        savefile.elementNames.get("Plural")!,
      );
      expect(missing).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`24`);
      expect(toLineageString(lineage)).toMatchSnapshot();
    });

    it("should generate a lineage for 'Detective'", async () => {
      const { lineage, missing } = await generateLineage(
        savefile.elementNames.get("Detective")!,
      );
      expect(missing).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`193`);
      expect(toLineageString(lineage)).toMatchSnapshot();
    });

    it("should generate a lineage for 'Acronym'", async () => {
      const { lineage, missing } = await generateLineage(
        savefile.elementNames.get("Acronym")!,
      );
      expect(missing).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`34`);
      expect(toLineageString(lineage)).toMatchSnapshot();
    });

    it("should generate a lineage for 'Soul'", async () => {
      const { lineage, missing } = await generateLineage(
        savefile.elementNames.get("Soul")!,
      );
      expect(missing).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`66`);
      expect(toLineageString(lineage)).toMatchSnapshot();
    });
  });

  describe("catstone-2026-06-06.ic savefile", async () => {
    const raw = loadFixture("catstone-2026-06-06.ic");
    // @ts-expect-error should be not null
    const savefile: Savefile = await Savefile.decode(raw);
    const { generateLineage } = await calculateElementDepths(savefile.elements);

    it("should generate a lineage for 'Plural'", async () => {
      const { lineage, missing } = await generateLineage(
        savefile.elementNames.get("Plural")!,
      );
      expect(missing).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`20`);
      expect(toLineageString(lineage)).toMatchSnapshot();
    });

    it("should generate a lineage for 'Detective'", async () => {
      const { lineage, missing } = await generateLineage(
        savefile.elementNames.get("Detective")!,
      );
      expect(missing).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`10`);
      expect(toLineageString(lineage)).toMatchSnapshot();
    });

    it("should generate a lineage for 'Acronym'", async () => {
      const { lineage, missing } = await generateLineage(
        savefile.elementNames.get("Acronym")!,
      );
      expect(missing).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`19`);
      expect(toLineageString(lineage)).toMatchSnapshot();
    });

    it("should generate a lineage for 'Soul'", async () => {
      const { lineage, missing } = await generateLineage(
        savefile.elementNames.get("Soul")!,
      );
      expect(missing).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`19`);
      expect(toLineageString(lineage)).toMatchSnapshot();
    });
  });
});
