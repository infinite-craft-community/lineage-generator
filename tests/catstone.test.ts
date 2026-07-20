import { describe, it, expect } from "bun:test";

import { loadFixture } from "@savefile/fixtures";
import { Savefile } from "savefile.js";

import { loadFromSavefile } from "#lib/catstone";
import type { CatstoneStep } from "#lib/catstone";

function catstoneStepToString(step: CatstoneStep): string {
  return `${step[0]} + ${step[1]} = ${step[2]}`;
}

function toCatstoneLineageString(lineage: CatstoneStep[]): string {
  return lineage.map(catstoneStepToString).join("\n");
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
      expect(toCatstoneLineageString(lineage)).toMatchSnapshot();
    });

    it("should generate a lineage for 'Detective'", async () => {
      const { lineage, missingElements } = await generateLineage("Detective");
      expect(missingElements).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`172`);
      expect(toCatstoneLineageString(lineage)).toMatchSnapshot();
    });

    it("should generate a lineage for 'Acronym'", async () => {
      const { lineage, missingElements } = await generateLineage("Acronym");
      expect(missingElements).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`62`);
      expect(toCatstoneLineageString(lineage)).toMatchSnapshot();
    });

    it("should generate a lineage for 'Soul'", async () => {
      const { lineage, missingElements } = await generateLineage("Soul");
      expect(missingElements).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`51`);
      expect(toCatstoneLineageString(lineage)).toMatchSnapshot();
    });

    it("should generate a lineage for multiple targets: Plural + Soul", async () => {
      const { lineage, missingElements } = await generateLineage([
        "Plural",
        "Soul",
      ]);
      expect(missingElements).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`55`);
      expect(toCatstoneLineageString(lineage)).toMatchSnapshot();
    });

    it("should generate a lineage for multiple targets: Plural + Detective + Acronym", async () => {
      const { lineage, missingElements } = await generateLineage([
        "Plural",
        "Detective",
        "Acronym",
      ]);
      expect(missingElements).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`200`);
      expect(toCatstoneLineageString(lineage)).toMatchSnapshot();
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
      expect(toCatstoneLineageString(lineage)).toMatchSnapshot();
    });

    it("should generate a lineage for 'Detective'", async () => {
      const { lineage, missingElements } = await generateLineage("Detective");
      expect(missingElements).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`146`);
      expect(toCatstoneLineageString(lineage)).toMatchSnapshot();
    });

    it("should generate a lineage for 'Acronym'", async () => {
      const { lineage, missingElements } = await generateLineage("Acronym");
      expect(missingElements).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`33`);
      expect(toCatstoneLineageString(lineage)).toMatchSnapshot();
    });

    it("should generate a lineage for 'Soul'", async () => {
      const { lineage, missingElements } = await generateLineage("Soul");
      expect(missingElements).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`51`);
      expect(toCatstoneLineageString(lineage)).toMatchSnapshot();
    });

    it("should generate a lineage for multiple targets: Plural + Soul", async () => {
      const { lineage, missingElements } = await generateLineage([
        "Plural",
        "Soul",
      ]);
      expect(missingElements).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`55`);
      expect(toCatstoneLineageString(lineage)).toMatchSnapshot();
    });

    it("should generate a lineage for multiple targets: Plural + Detective + Acronym", async () => {
      const { lineage, missingElements } = await generateLineage([
        "Plural",
        "Detective",
        "Acronym",
      ]);
      expect(missingElements).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`166`);
      expect(toCatstoneLineageString(lineage)).toMatchSnapshot();
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
      expect(lineage.length).toMatchInlineSnapshot(`22`);
      expect(toCatstoneLineageString(lineage)).toMatchSnapshot();
    });

    it("should generate a lineage for 'Detective'", async () => {
      const { lineage, missingElements } = await generateLineage("Detective");
      expect(missingElements).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`9`);
      expect(toCatstoneLineageString(lineage)).toMatchSnapshot();
    });

    it("should generate a lineage for 'Acronym'", async () => {
      const { lineage, missingElements } = await generateLineage("Acronym");
      expect(missingElements).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`13`);
      expect(toCatstoneLineageString(lineage)).toMatchSnapshot();
    });

    it("should generate a lineage for 'Soul'", async () => {
      const { lineage, missingElements } = await generateLineage("Soul");
      expect(missingElements).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`18`);
      expect(toCatstoneLineageString(lineage)).toMatchSnapshot();
    });

    it("should generate a lineage for multiple targets: Plural + Soul", async () => {
      const { lineage, missingElements } = await generateLineage([
        "Plural",
        "Soul",
      ]);
      expect(missingElements).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`32`);
      expect(toCatstoneLineageString(lineage)).toMatchSnapshot();
    });

    it("should generate a lineage for multiple targets: Plural + Detective + Acronym", async () => {
      const { lineage, missingElements } = await generateLineage([
        "Plural",
        "Detective",
        "Acronym",
      ]);
      expect(missingElements).toBeEmpty();
      expect(lineage.length).toMatchInlineSnapshot(`29`);
      expect(toCatstoneLineageString(lineage)).toMatchSnapshot();
    });
  });
});
