import type { ICElement, ICElementRecipe } from "savefile.js";

type ICElementRecipeWithDepth = ICElementRecipe & {
  a: ICElementWithDepth;
  b: ICElementWithDepth;
};

type ICElementWithDepth = ICElement & {
  recipes: ICElementRecipeWithDepth[];
  depth: number;
};

export type Step = [ICElement, ICElement, ICElement];

function findOptimalRecipe(
  recipes: ICElementRecipeWithDepth[],
  t: Set<ICElement>,
  achievedElementsSet: Set<ICElement>,
) {
  let lowestDepth = Infinity;
  let bestRecipe;

  const firstRecipe = recipes[0];

  if (!firstRecipe) return;

  for (const recipe of recipes) {
    if (t.has(recipe.a)) continue;

    if (!t.has(recipe.b)) {
      const depth =
        (achievedElementsSet.has(recipe.a) ? 0 : recipe.a.depth) +
        (achievedElementsSet.has(recipe.b) || recipe.a == recipe.b
          ? 0
          : recipe.b.depth);

      if (depth < lowestDepth) {
        lowestDepth = depth;
        bestRecipe = recipe;
      }
    }
  }

  if (bestRecipe) return bestRecipe;

  return !t.has(firstRecipe.a) && !t.has(firstRecipe.b) && firstRecipe;
}

async function getLineageSteps(
  targets: ICElementWithDepth[],
  baseElements: ICElementWithDepth[],
): Promise<readonly [Step[], ICElementWithDepth[]]> {
  const achievedElementsSet = new Set<ICElement>(baseElements);
  const missingElementsSet = new Set<ICElementWithDepth>();
  const set__s = new Set<ICElement>();
  const recipes: Step[] = [];

  const targetToRecipeMap = new Map<ICElement, ICElementRecipe>();

  while (targets.length) {
    const target = targets.pop()!;
    const targetRecipe = targetToRecipeMap.get(target);

    if (achievedElementsSet.has(target)) continue;

    if (targetRecipe) {
      achievedElementsSet.delete(targetRecipe[0]);
      achievedElementsSet.delete(targetRecipe[1]);
    }

    const optimalRecipe = findOptimalRecipe(
      target.recipes,
      set__s,
      achievedElementsSet,
    );

    if (optimalRecipe) {
      if (
        achievedElementsSet.has(optimalRecipe.a) &&
        achievedElementsSet.has(optimalRecipe.b)
      ) {
        recipes.push([optimalRecipe.a, optimalRecipe.b, target]);
        set__s.delete(target);
        achievedElementsSet.add(target);
      } else if (targetRecipe) {
        recipes.push([targetRecipe.a, targetRecipe.b, target]);
        set__s.delete(target);
        achievedElementsSet.add(targetRecipe.a);
        achievedElementsSet.add(targetRecipe.b);
        achievedElementsSet.add(target);
      } else {
        set__s.add(target);
        targets.push(target);
        targetToRecipeMap.set(target, optimalRecipe);
        if (!achievedElementsSet.has(optimalRecipe.b))
          targets.push(optimalRecipe.b);
        if (!achievedElementsSet.has(optimalRecipe.a))
          targets.push(optimalRecipe.a);
      }
    } else {
      missingElementsSet.add(target);
      set__s.delete(target);
      achievedElementsSet.add(target);
      if (recipes.length % 500 === 0) await new Promise(setTimeout);
    }
  }

  const missing = [...missingElementsSet];

  return [recipes, missing] as const;
}

async function sortLineageSteps(
  steps: Step[],
  missingElements: ICElementWithDepth[],
  elements: ICElementWithDepth[],
): Promise<Step[]> {
  const elementsSet = new Set(elements);
  const stepsSet = new Set(steps);
  const sortedSteps: Step[] = [];
  for (; stepsSet.size; ) {
    let e = 0;
    for (const step of stepsSet) {
      if (elementsSet.has(step[0]) && elementsSet.has(step[1])) {
        sortedSteps.push(step);
        stepsSet.delete(step);
        elementsSet.add(step[2]);
        e++;
      }
    }

    if (!e) {
      if (!missingElements.length) break;
      const r = missingElements.reduce((e, t) => (t.depth < e.depth ? t : e));
      missingElements.splice(missingElements.indexOf(r), 1);
      elementsSet.add(r);
    }

    if (sortedSteps.length % 500 == 0) await new Promise(setTimeout);
  }
  return sortedSteps;
}

async function precalculateElementDepths(
  saveElements: ICElement[],
): Promise<{ baseElements: ICElementWithDepth[] }> {
  const elements = saveElements as ICElementWithDepth[];
  const baseElements = elements.slice(0, 4);

  await (async () => {
    for (const element of elements) element.depth = Infinity;

    for (const baseElement of baseElements) baseElement.depth = 0;

    while (true) {
      let number__n = 0;
      for (const element of elements) {
        let minDepth = element.depth;
        for (const recipe of element.recipes) {
          const totalDepth = recipe.a.depth + recipe.b.depth + 1;
          if (totalDepth < minDepth) {
            minDepth = totalDepth;
          }
        }
        if (element.depth > minDepth) {
          element.depth = minDepth;
          number__n++;
        }
      }
      await new Promise(setTimeout);
      if (!number__n) break;
    }
  })();

  return { baseElements };
}

async function generateLineage(
  target: ICElement | ICElement[],
  elements: ICElement[],
): Promise<{
  readonly lineage: Step[];
  readonly missing: ICElementWithDepth[];
}> {
  const { baseElements } = await precalculateElementDepths(elements);

  const targets = (
    Array.isArray(target) ? target : [target]
  ) as ICElementWithDepth[];

  const [recipes, missing] = await getLineageSteps(targets, baseElements);

  const lineage = await sortLineageSteps(recipes, [...missing], baseElements);

  return { lineage, missing } as const;
}

export { precalculateElementDepths, generateLineage };
