import type { ICItemData } from "@infinite-craft/dom-types";
import type { ICElement } from "savefile.js";

import { icCaseText, pushToArrayArray } from "./catstone/helpers";
import { PriorityQueue } from "./catstone/priority-queue";

const baseElementsString = ["Water", "Fire", "Wind", "Earth"] as const;

type ICItemDataRecipe = [first: number, second: number];
type ICItemDataRecipes = ICItemDataRecipe[];
type ICLineageStep = [first: number, second: number, result: number];
type ICLineage = ICLineageStep[];
type HybridStep = [string, string, string];

interface State {
  baseElementsId: number[];
  recipesIngIC: Map<string, number>;
  recipesResIC: ICItemDataRecipes[];
  recipesUsesIC: ICItemDataRecipes[];
  elementHeur: number[];
  nonExistentIcCaseId: number;
  icCasedLookup: number[];
  elementIdToText: string[];
  elementTextToId: Map<string, number>;
}

// ============= Data Structure Building =============

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
    resultId = state.nonExistentIcCaseId++;
    addElement(state, resultText, resultId);
  }
  state.icCasedLookup[inputId] = resultId;
  return resultId;
}

// ============= Depth Calculation (Dijkstra, one-time) =============

function computeDepths(state: State): void {
  const pq = new PriorityQueue<[number, number]>((a, b) => b[0] > a[0]);

  for (const startElement of state.baseElementsId) {
    const heur = state.elementHeur[startElement];
    if (heur === undefined) {
      throw new Error(`${startElement} does not have a heur.`);
    }
    pq.push([heur, startElement]);
  }

  while (!pq.isEmpty()) {
    const [elementHeur, element] = pq.pop();
    if ((state.elementHeur[element] ?? Infinity) < elementHeur) continue;

    for (const [other, result] of state.recipesUsesIC[element] ?? []) {
      const otherHeur =
        element === other ? 0 : (state.elementHeur[other] ?? Infinity);
      if (otherHeur === Infinity) continue;

      const newHeur = elementHeur + otherHeur + 1;
      const resultHeur = state.elementHeur[result] ?? Infinity;
      if (resultHeur > newHeur) {
        state.elementHeur[result] = newHeur;
        pq.push([newHeur, result]);
      }
    }
  }
}

// ============= Recipe Selection Strategies =============

type RecipeSelector = (
  recipes: ICItemDataRecipes,
  heurMap: number[],
) => ICItemDataRecipe;

function selectMinimax(
  recipes: ICItemDataRecipes,
  heurMap: number[],
): ICItemDataRecipe {
  let bestMax = Infinity;
  let bestMin = Infinity;
  let bestRecipe = recipes[0]!;

  for (const recipe of recipes) {
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

function selectMinimaxFlipped(
  recipes: ICItemDataRecipes,
  heurMap: number[],
): ICItemDataRecipe {
  const recipe = selectMinimax(recipes, heurMap);
  return [recipe[1], recipe[0]];
}

function selectMinsum(
  recipes: ICItemDataRecipes,
  heurMap: number[],
): ICItemDataRecipe {
  let bestSum = Infinity;
  let bestRecipe = recipes[0]!;

  for (const recipe of recipes) {
    const [f, s] = recipe;
    const fh = heurMap[f] ?? Infinity;
    const sh = f === s ? 0 : (heurMap[s] ?? Infinity);
    const sum = fh + sh;

    if (sum < bestSum) {
      bestSum = sum;
      bestRecipe = recipe;
    }
  }
  return bestRecipe;
}

function selectMinsumFlipped(
  recipes: ICItemDataRecipes,
  heurMap: number[],
): ICItemDataRecipe {
  const recipe = selectMinsum(recipes, heurMap);
  return [recipe[1], recipe[0]];
}

// ============= Lineage Generation (no recalc) =============

function generateLineageInternal(
  state: State,
  goals: number[],
  recipeSelector: RecipeSelector,
): ICLineage {
  const elementQueue = [...goals];
  const crafted = new Set<number>();
  const visitedLastPath = new Map<number, number>();
  const lineage: ICLineage = [];

  while (elementQueue.length > 0) {
    const element = elementQueue.pop()!;
    if (crafted.has(element)) continue;

    const elementRecipesArr = state.recipesResIC[element];
    if (elementRecipesArr === undefined) {
      crafted.add(element);
      continue;
    }

    const bestRecipe = recipeSelector(elementRecipesArr, state.elementHeur);

    let neededIng: number | undefined;
    for (const ing of bestRecipe) {
      if (!state.baseElementsId.includes(ing) && !crafted.has(ing)) {
        neededIng = ing;
        break;
      }
    }

    if (neededIng !== undefined) {
      if (visitedLastPath.get(element) === neededIng) {
        crafted.add(neededIng);
        continue;
      }
      elementQueue.push(element, neededIng);
      visitedLastPath.set(element, neededIng);
    } else {
      lineage.push([...bestRecipe, element]);
      crafted.add(element);
    }
  }
  return lineage;
}

// ============= Post-Processing =============

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
): { lineage: ICLineage; missingElements: number[] } {
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
    const neededIngs = [];
    for (const ing of recipe) {
      if (!state.baseElementsId.includes(ing) && !crafted.has(ing)) {
        neededIngs.push(ing);
      }
    }
    if (neededIngs.length === 0) {
      crafted.add(element);

      const actualResult = state.recipesIngIC.get(
        ([recipe[0], recipe[1]] as ICItemDataRecipe)
          .sort((a, b) => a - b)
          .join("="),
      )!;
      capsMap.set(element, actualResult);
      const newRecipe = [recipe[0], recipe[1], element].map(
        (x) => capsMap.get(x) ?? x,
      ) as ICLineageStep;
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

// ============= Output =============

function toLineageSteps(state: State, lineage: ICLineage): HybridStep[] {
  return lineage.map((recipe) => [
    state.elementIdToText[recipe[0]]!,
    state.elementIdToText[recipe[1]]!,
    state.elementIdToText[recipe[2]]!,
  ]);
}

// ============= Main API =============

interface HybridResult {
  generateLineage(
    target: string | readonly string[],
  ): Promise<{ lineage: HybridStep[]; missingElements: string[] }>;
}

const recipeSelectors: RecipeSelector[] = [
  selectMinimax,
  selectMinimaxFlipped,
  selectMinsum,
  selectMinsumFlipped,
];

function loadElements(items: ICItemData[]): HybridResult {
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

  computeDepths(state);

  function resolveGoals(goals: string[]): number[] {
    return goals.map((goal) => {
      const id = state.elementTextToId.get(icCaseText(goal));
      if (id === undefined) throw new Error(`Unknown element: ${goal}`);
      return id;
    });
  }

  return {
    async generateLineage(
      target: string | readonly string[],
    ): Promise<{ lineage: HybridStep[]; missingElements: string[] }> {
      const goals = Array.isArray(target) ? target : [target];
      const goalIds = resolveGoals(goals);

      let bestResult = null;
      for (const selector of recipeSelectors) {
        const lineage = generateLineageInternal(state, goalIds, selector);
        const pruned = removeUnnecessary(state, lineage, goalIds);
        const { lineage: ordered, missingElements } =
          correctlyCapsAndOrderLineage(state, pruned, goalIds);

        if (!bestResult || ordered.length < bestResult.lineage.length) {
          bestResult = { lineage: ordered, missingElements };
        }
      }

      return {
        lineage: toLineageSteps(state, bestResult!.lineage),
        missingElements: bestResult!.missingElements.map(
          (id) => state.elementIdToText[id]!,
        ),
      };
    },
  };
}

function loadFromSavefile(elements: ICElement[]): HybridResult {
  return loadElements(
    elements.map((e) => ({
      text: e.text,
      id: e.id,
      recipes: e.recipes.map((r) => [r.a.id, r.b.id]),
    })),
  );
}

export { loadElements, loadFromSavefile };

export type { HybridResult, HybridStep };
