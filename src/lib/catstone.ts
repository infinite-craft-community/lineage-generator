import type { ICItemData } from "@infinite-craft/dom-types";
import type { ICElement } from "savefile.js";

import { icCaseText, pushToArrayArray } from "./catstone/helpers";
import { PriorityQueue } from "./catstone/priority-queue";

const baseElementsString = ["Water", "Fire", "Wind", "Earth"] as const;

type ICItemDataRecipe = [first: number, second: number];
type ICItemDataRecipes = ICItemDataRecipe[];
type ICLineageStep = [first: number, second: number, result: number];
type ICLineage = ICLineageStep[];
type CatstoneStep = [string, string, string];

interface State {
  baseElementsId: number[];
  /** `"Water=Water" => "Lake"` */
  recipesIngIC: Map<string, number>;
  /** `"Lake" => ["Water", "Water"]` */
  recipesResIC: ICItemDataRecipes[];
  /** `"Water" => ["Water", "Lake"]` */
  recipesUsesIC: ICItemDataRecipes[];
  /** `"Lake" => 1` */
  elementHeur: number[];
  nonExistentIcCaseId: number;
  icCasedLookup: number[];
  /** `1 => "Fire"` */
  elementIdToText: string[];
  /** `"Fire" => 1` */
  elementTextToId: Map<string, number>;
}

function addElement(state: State, text: string, id: number): void {
  state.elementIdToText[id] = text;
  state.elementTextToId.set(text, id);
}

function addRecipe(
  state: State,
  first: number,
  second: number,
  result: number,
): void {
  if (
    !Number.isInteger(first) ||
    !Number.isInteger(second) ||
    !Number.isInteger(result)
  ) {
    return;
  }

  const F = icCaseId(state, first);
  const S = icCaseId(state, second);
  const R = icCaseId(state, result);
  if (F === R || S === R) return;

  const sortedFS = S > F ? ([F, S] as const) : ([S, F] as const);
  const combString = sortedFS.join("=");
  state.recipesIngIC.set(combString, result);

  pushToArrayArray(state.recipesResIC, R, sortedFS);
  pushToArrayArray(state.recipesUsesIC, F, [S, R]);
  if (F !== S) pushToArrayArray(state.recipesUsesIC, S, [F, R]);
}

function icCaseId(state: State, inputId: number): number {
  const mapOutput = state.icCasedLookup[inputId];
  if (mapOutput !== undefined) return mapOutput;

  const inputText = state.elementIdToText[inputId]!;
  const resultText = icCaseText(inputText);

  let resultId = state.elementTextToId.get(resultText);
  if (resultId === undefined) {
    // example: it is `End Of Sentence` but the user only has `End of Sentence`...
    resultId = state.nonExistentIcCaseId++;
    addElement(state, resultText, resultId);
  }
  state.icCasedLookup[inputId] = resultId;
  return resultId;
}

async function* generateLineageMultipleMethodsInternal(
  state: State,
  goals: number[],
) {
  const lineageGenerators = {
    Simple: () => generateLineageInternal(state, goals),
    "Normal Recalc": () => generateLineageInternal(state, goals, 1),
    "Reverse Recalc": () => generateLineageInternal(state, goals, 2),
    "Min Recalc": () => generateLineageInternal(state, goals, 3),
    "Max Recalc": () => generateLineageInternal(state, goals, 4),
    "Random Recalc": () => generateLineageInternal(state, goals, 5),
  };

  // Now iterate through the generators and run them
  for (const [methodName, generateFunc] of Object.entries(lineageGenerators)) {
    const { lineage, missingElements } = generateFunc();
    yield { lineage, methodName, missingElements };
  }
}

function generateElementHeuristics(
  state: State,
  startElements: number[],
  heurMap: number[],
  end = Infinity,
) {
  const pq = new PriorityQueue((a, b) => b[0] > a[0]);

  for (const startElement of startElements) {
    const heur = heurMap[startElement];
    if (heur === undefined) {
      {
        throw new Error(`${startElement} does not have a heur.`);
      }
    }

    pq.push([heur, startElement]);
  }

  while (!pq.isEmpty()) {
    const [elementHeur, element] = pq.pop();
    if ((heurMap[element] ?? Infinity) < elementHeur) continue;

    for (const [other, result] of state.recipesUsesIC[element] ?? []) {
      const otherHeur = element === other ? 0 : heurMap[other];
      if (otherHeur === undefined) continue;

      const newHeur = elementHeur + otherHeur + 1;
      if (newHeur > end) continue;

      const resultHeur = heurMap[result] ?? Infinity;
      if (resultHeur > newHeur) {
        heurMap[result] = newHeur;
        pq.push([newHeur, result]);
      }
    }
  }
}

function findBestRecipeHeur(
  recipesArr: ICItemDataRecipes,
  heurMap: number[],
): ICItemDataRecipe {
  let bestMax = Infinity,
    bestMin = Infinity,
    bestRecipe = recipesArr[0]!;

  for (const recipe of recipesArr) {
    const [f, s] = recipe;
    let fh = heurMap[f] ?? Infinity;
    let sh = f === s ? 0 : (heurMap[s] ?? Infinity);

    if (fh < sh) [fh, sh] = [sh, fh];

    if (fh < bestMax || (fh === bestMax && sh < bestMin)) {
      bestMax = fh;
      bestMin = sh;
      bestRecipe = recipe;
    }
  }
  return bestRecipe;
}

function generateLineageInternal(
  state: State,
  goals: number[],
  recalc: false | number = false,
) {
  const elementQueue = [...goals];
  const crafted = new Set<number>();
  const visitedLastPath = new Map(); // for invalid lineages with infinite loops
  const heurMap = [...state.elementHeur];
  const lineage: ICLineage = [];

  while (elementQueue.length > 0) {
    const element = elementQueue.pop()!;
    if (crafted.has(element)) continue;

    const elementRecipesArr = state.recipesResIC[element];
    if (elementRecipesArr === undefined) {
      // no recipe found, add as missing
      crafted.add(element);
      continue;
    }

    let bestRecipe = findBestRecipeHeur(elementRecipesArr, heurMap);

    if (recalc === 2) {
      bestRecipe = [bestRecipe[1], bestRecipe[0]];
    } else if (
      recalc === 3 &&
      heurMap[bestRecipe[0]]! > heurMap[bestRecipe[1]]!
    ) {
      bestRecipe = [bestRecipe[1], bestRecipe[0]];
    } else if (
      recalc === 4 &&
      heurMap[bestRecipe[0]]! < heurMap[bestRecipe[1]]!
    ) {
      bestRecipe = [bestRecipe[1], bestRecipe[0]];
    } else if (recalc === 5 && Math.round(Math.random())) {
      bestRecipe = [bestRecipe[1], bestRecipe[0]];
    }

    let neededIng;
    for (const ing of bestRecipe) {
      if (!state.baseElementsId.includes(ing) && !crafted.has(ing)) {
        neededIng = ing;
        break;
      }
    }

    if (neededIng !== undefined) {
      // still missing stuff to craft element...
      if (visitedLastPath.get(element) === neededIng) {
        // infinite loop, add as missing
        crafted.add(neededIng);
        continue;
      }
      elementQueue.push(element, neededIng);
      visitedLastPath.set(element, neededIng);
    } else {
      // can add element!
      lineage.push([...bestRecipe!, element]);
      crafted.add(element);
      heurMap[element] = 0;

      if (recalc && elementQueue.length > 0) {
        const worst = elementQueue.reduce<{ element?: number; heur: number }>(
          (best, el) => {
            const heur = heurMap[el]!;
            return heur > best.heur ? { element: el, heur } : best;
          },
          { element: undefined, heur: -Infinity },
        );

        generateElementHeuristics(state, [element], heurMap, worst.heur);
      }
    }
  }
  return correctlyCapsAndOrderLineage(
    state,
    removeUnnecessary(state, lineage, goals),
    goals,
  );
}

type ResultIngredientsMap = Map<number, ICItemDataRecipe>;
type UsedMap = Map<number, Set<number>>;

function removeUnnecessary(
  state: State,
  lineage: ICLineage,
  goals: number[],
): ICLineage {
  const resultIngMap: ResultIngredientsMap = new Map<number, ICItemDataRecipe>(
    lineage.map((recipe) => [recipe[2], [recipe[0], recipe[1]]]),
  );

  const usedMap = new Map(
    lineage.map((recipe) => [recipe[2], new Set<number>()]),
  );

  for (const [f, s, r] of lineage) {
    if (!state.baseElementsId.includes(f)) usedMap.get(f)?.add(r);
    if (!state.baseElementsId.includes(s)) usedMap.get(s)?.add(r);
  }

  for (let i = lineage.length - 1; i >= 0; i--) {
    const [, , result] = lineage[i]!;
    if (goals.includes(result)) continue;

    // try to remove recipe step by rerouting other recipes

    const blacklist = getBlacklistForRemoval(result, usedMap);
    const changes: [number, ICItemDataRecipe][] = [];

    let removeable = true;
    for (const use of usedMap.get(result)!) {
      const replacementRecipe = state.recipesResIC[use]!.find(
        ([newF, newS]) =>
          (state.baseElementsId.includes(newF) ||
            (resultIngMap.has(newF) && !blacklist.has(newF))) &&
          (state.baseElementsId.includes(newS) ||
            (resultIngMap.has(newS) && !blacklist.has(newS))),
      );
      if (replacementRecipe) changes.push([use, replacementRecipe]);
      else {
        removeable = false;
        break;
      }
    }
    if (removeable) {
      // we can remove result!!
      switchRecipeForRemoval(state, result, undefined, resultIngMap, usedMap);
      for (const [changeResult, changeIngredients] of changes) {
        switchRecipeForRemoval(
          state,
          changeResult,
          changeIngredients,
          resultIngMap,
          usedMap,
        );
      }
    }
  }

  return [...resultIngMap.entries()].map(([result, ings]) => [
    ings[0],
    ings[1],
    result,
  ]);
}

function getBlacklistForRemoval(
  element: number,
  usedMap: UsedMap,
): Set<number> {
  const blacklist = new Set([element]);
  for (const blackElement of blacklist) {
    for (const use of usedMap.get(blackElement)!) {
      blacklist.add(use);
    }
  }
  return blacklist;
}

function switchRecipeForRemoval(
  state: State,
  result: number,
  newRecipe: ICItemDataRecipe | undefined,
  resultIngMap: ResultIngredientsMap,
  usedMap: UsedMap,
): void {
  const originalRecipe = resultIngMap.get(result)!;
  for (const x of originalRecipe) {
    if (!state.baseElementsId.includes(x)) usedMap.get(x)?.delete(result);
  }

  if (!newRecipe) {
    resultIngMap.delete(result);
  } else {
    resultIngMap.set(result, newRecipe);
    for (const x of newRecipe) {
      if (!state.baseElementsId.includes(x)) usedMap.get(x)!.add(result);
    }
  }
}

function correctlyCapsAndOrderLineage(
  state: State,
  lineage: ICLineage,
  goals: number[],
) {
  const resultIngMap: ResultIngredientsMap = new Map<number, ICItemDataRecipe>(
    lineage.map((recipe) => [recipe[2], [recipe[0], recipe[1]]]),
  );

  const elementQueue = [...goals];
  const crafted = new Set<number>();
  const capsMap = new Map<number, number>();
  const missingElements = [];
  const newLineage: ICLineage = [];

  while (elementQueue.length > 0) {
    const element = elementQueue.pop()!;
    if (crafted.has(element)) continue;

    const recipe = resultIngMap.get(element);
    if (recipe === undefined) {
      crafted.add(element);
      missingElements.push(element);
      continue;
    }
    let neededIngs = [];
    for (const ing of recipe) {
      if (!state.baseElementsId.includes(ing) && !crafted.has(ing)) {
        neededIngs.push(ing);
      }
    }
    if (neededIngs.length === 0) {
      crafted.add(element);

      const actualResult = state.recipesIngIC.get(
        (<ICItemDataRecipe>[recipe[0], recipe[1]])
          .sort((a, b) => a - b)
          .join("="),
      )!;
      capsMap.set(element, actualResult);
      const newRecipe = <ICLineageStep>(
        [recipe[0], recipe[1], element].map((x) => capsMap.get(x) ?? x)
      );
      if (
        state.elementIdToText[newRecipe[0]]! >
        state.elementIdToText[newRecipe[1]]!
      ) {
        [newRecipe[0], newRecipe[1]] = [newRecipe[1], newRecipe[0]];
      }
      newLineage.push(newRecipe);
    } else elementQueue.push(element, ...neededIngs);
  }
  return { lineage: newLineage, missingElements };
}

interface CatstoneLineageResult {
  readonly lineage: CatstoneStep[];
  readonly missingElements: string[];
}

interface CatstoneMultipleMethodsResult {
  readonly lineage: CatstoneStep[];
  readonly methodName: string;
  readonly missingElements: string[];
}

interface CatstoneResult {
  generateLineage(target: string | string[]): Promise<CatstoneLineageResult>;
  generateLineageMultipleMethods(
    goals: string[],
  ): AsyncGenerator<CatstoneMultipleMethodsResult>;
  state: State;
}

function toLineageSteps(state: State, lineage: ICLineage): CatstoneStep[] {
  return lineage.map((recipe) => [
    state.elementIdToText[recipe[0]]!,
    state.elementIdToText[recipe[1]]!,
    state.elementIdToText[recipe[2]]!,
  ]);
}

function loadElements(items: ICItemData[]): CatstoneResult {
  const state: State = {
    recipesIngIC: new Map(),
    recipesResIC: [],
    recipesUsesIC: [],
    elementHeur: [],
    nonExistentIcCaseId: 0,
    icCasedLookup: [],
    elementIdToText: [],
    elementTextToId: new Map(),
    baseElementsId: [],
  };

  for (const element of items) {
    addElement(state, element.text, element.id);
  }

  state.baseElementsId = baseElementsString.map((x) =>
    state.elementTextToId.get(x)!,
  );

  state.nonExistentIcCaseId = items.length + 20_000;

  for (const element of items) {
    for (const [fID, sID] of element.recipes ?? []) {
      addRecipe(state, fID, sID, element.id);
    }
  }

  for (const baseElement of state.baseElementsId) {
    state.elementHeur[baseElement] = 0;
  }

  generateElementHeuristics(state, state.baseElementsId, state.elementHeur);

  function resolveGoals(goals: string[]): number[] {
    return goals.map((goal) => {
      const id = state.elementTextToId.get(icCaseText(goal));
      if (id === undefined) throw new Error(`Unknown element: ${goal}`);
      return id;
    });
  }

  return {
    state,
    async generateLineage(
      target: string | string[],
    ): Promise<CatstoneLineageResult> {
      const goals = Array.isArray(target) ? target : [target];
      const goalIds = resolveGoals(goals);

      let bestResult = null;
      for await (const result of generateLineageMultipleMethodsInternal(
        state,
        goalIds,
      )) {
        if (result.methodName === "Random Recalc") continue;
        if (!bestResult || result.lineage.length < bestResult.lineage.length) {
          bestResult = result;
        }
      }

      return {
        lineage: toLineageSteps(state, bestResult!.lineage),
        missingElements: bestResult!.missingElements.map(
          (id) => state.elementIdToText[id]!,
        ),
      };
    },

    async *generateLineageMultipleMethods(
      goals: string[],
    ): AsyncGenerator<CatstoneMultipleMethodsResult> {
      const goalIds = resolveGoals(goals);
      for await (const result of generateLineageMultipleMethodsInternal(
        state,
        goalIds,
      )) {
        yield {
          lineage: toLineageSteps(state, result.lineage),
          methodName: result.methodName,
          missingElements: result.missingElements.map(
            (id) => state.elementIdToText[id]!,
          ),
        };
      }
    },
  };
}

function loadFromSavefile(elements: ICElement[]): CatstoneResult {
  return loadElements(
    elements.map((e) => ({
      text: e.text,
      id: e.id,
      recipes: e.recipes.map((r) => [r.a.id, r.b.id]),
    })),
  );
}

function addElementIncremental(
  state: State,
  text: string,
  id: number,
  recipes?: ICItemDataRecipes,
): void {
  addElement(state, text, id);

  for (const [firstId, secondId] of recipes ?? []) {
    addRecipe(state, firstId, secondId, id);

    const first = icCaseId(state, firstId);
    const second = icCaseId(state, secondId);
    const result = icCaseId(state, id);

    const newHeur =
      (state.elementHeur[first] ?? Infinity) +
      (state.elementHeur[second] ?? Infinity) +
      1;

    if ((state.elementHeur[result] ?? Infinity) > newHeur) {
      state.elementHeur[result] = newHeur;
      generateElementHeuristics(state, [result], state.elementHeur);
    }
  }
}

export { loadElements, loadFromSavefile, addElementIncremental };

export type {
  CatstoneResult,
  CatstoneLineageResult,
  CatstoneMultipleMethodsResult,
  CatstoneStep,
  State,
};
