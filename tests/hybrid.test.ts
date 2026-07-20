import { describe, it, expect } from "bun:test";

import { loadFixture } from "@savefile/fixtures";
import { Savefile } from "savefile.js";

import { loadFromSavefile } from "#lib/hybrid";
import type { HybridStep } from "#lib/hybrid";

function hybridStepToString(step: HybridStep): string {
  return `${step[0]} + ${step[1]} = ${step[2]}`;
}

function toHybridLineageString(lineage: HybridStep[]): string {
  return lineage.map(hybridStepToString).join("\n");
}

describe("generateLineage", () => {
  describe("2024-10-18.json savefile", async () => {
    const raw = loadFixture("2024-10-18.json");
    // @ts-expect-error should be not null
    const savefile: Savefile = await Savefile.decode(raw);
    const { generateLineage } = loadFromSavefile(savefile.elements);

    it("should generate a lineage for 'Plural'", async () => {
      const { lineage, missingElements } = await generateLineage("Plural");
      expect(missingElements).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`24`);
      expect(toHybridLineageString(lineage)).toMatchSnapshot();
    });

    it("should generate a lineage for 'Detective'", async () => {
      const { lineage, missingElements } = await generateLineage("Detective");
      expect(missingElements).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`253`);
      expect(toHybridLineageString(lineage)).toMatchSnapshot();
    });

    it("should generate a lineage for 'Acronym'", async () => {
      const { lineage, missingElements } = await generateLineage("Acronym");
      expect(missingElements).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`64`);
      expect(toHybridLineageString(lineage)).toMatchSnapshot();
    });

    it("should generate a lineage for 'Soul'", async () => {
      const { lineage, missingElements } = await generateLineage("Soul");
      expect(missingElements).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`51`);
      expect(toHybridLineageString(lineage)).toMatchSnapshot();
    });

    it("should generate a lineage for multiple targets: Plural + Soul", async () => {
      const { lineage, missingElements } = await generateLineage([
        "Plural",
        "Soul",
      ]);
      expect(missingElements).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`55`);
      expect(toHybridLineageString(lineage)).toMatchSnapshot();
    });

    it("should generate a lineage for multiple targets: Plural + Detective + Acronym", async () => {
      const { lineage, missingElements } = await generateLineage([
        "Plural",
        "Detective",
        "Acronym",
      ]);
      expect(missingElements).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`277`);
      expect(toHybridLineageString(lineage)).toMatchSnapshot();
    });
  });

  describe("2025-04-04.ic savefile", async () => {
    const raw = loadFixture("2025-04-04.ic");
    // @ts-expect-error should be not null
    const savefile: Savefile = await Savefile.decode(raw);
    const { generateLineage } = loadFromSavefile(savefile.elements);

    it("should generate a lineage for 'Plural'", async () => {
      const { lineage, missingElements } = await generateLineage("Plural");
      expect(missingElements).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`24`);
      expect(toHybridLineageString(lineage)).toMatchSnapshot();
    });

    it("should generate a lineage for 'Detective'", async () => {
      const { lineage, missingElements } = await generateLineage("Detective");
      expect(missingElements).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`157`);
      expect(toHybridLineageString(lineage)).toMatchSnapshot();
    });

    it("should generate a lineage for 'Acronym'", async () => {
      const { lineage, missingElements } = await generateLineage("Acronym");
      expect(missingElements).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`33`);
      expect(toHybridLineageString(lineage)).toMatchSnapshot();
    });

    it("should generate a lineage for 'Soul'", async () => {
      const { lineage, missingElements } = await generateLineage("Soul");
      expect(missingElements).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`51`);
      expect(toHybridLineageString(lineage)).toMatchSnapshot();
    });

    it("should generate a lineage for multiple targets: Plural + Soul", async () => {
      const { lineage, missingElements } = await generateLineage([
        "Plural",
        "Soul",
      ]);
      expect(missingElements).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`55`);
      expect(toHybridLineageString(lineage)).toMatchSnapshot();
    });

    it("should generate a lineage for multiple targets: Plural + Detective + Acronym", async () => {
      const { lineage, missingElements } = await generateLineage([
        "Plural",
        "Detective",
        "Acronym",
      ]);
      expect(missingElements).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`176`);
      expect(toHybridLineageString(lineage)).toMatchSnapshot();
    });
  });

  describe("catstone-2026-06-06.ic savefile", async () => {
    const raw = loadFixture("catstone-2026-06-06.ic");
    // @ts-expect-error should be not null
    const savefile: Savefile = await Savefile.decode(raw);
    const { generateLineage } = loadFromSavefile(savefile.elements);

    it("should generate a lineage for 'Plural'", async () => {
      const { lineage, missingElements } = await generateLineage("Plural");
      expect(missingElements).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`19`);
      expect(toHybridLineageString(lineage)).toMatchSnapshot();
    });

    it("should generate a lineage for 'Detective'", async () => {
      const { lineage, missingElements } = await generateLineage("Detective");
      expect(missingElements).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`9`);
      expect(toHybridLineageString(lineage)).toMatchSnapshot();
    });

    it("should generate a lineage for 'Acronym'", async () => {
      const { lineage, missingElements } = await generateLineage("Acronym");
      expect(missingElements).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`17`);
      expect(toHybridLineageString(lineage)).toMatchSnapshot();
    });

    it("should generate a lineage for 'Soul'", async () => {
      const { lineage, missingElements } = await generateLineage("Soul");
      expect(missingElements).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`19`);
      expect(toHybridLineageString(lineage)).toMatchSnapshot();
    });

    it("should generate a lineage for multiple targets: Plural + Soul", async () => {
      const { lineage, missingElements } = await generateLineage([
        "Plural",
        "Soul",
      ]);
      expect(missingElements).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`34`);
      expect(toHybridLineageString(lineage)).toMatchSnapshot();
    });

    it("should generate a lineage for multiple targets: Plural + Detective + Acronym", async () => {
      const { lineage, missingElements } = await generateLineage([
        "Plural",
        "Detective",
        "Acronym",
      ]);
      expect(missingElements).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`41`);
      expect(toHybridLineageString(lineage)).toMatchSnapshot();
    });
  });
});
