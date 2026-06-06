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
  recipes: ICElementRecipe[],
  t: Set<ICElement>,
  i: Set<ICElement>,
) {
  let lowestDepth = Infinity;
  let bestRecipe;
  let depth: number;

  if (!recipes?.length) return;

  for (const recipe of recipes) {
    if (t.has(recipe.a)) continue;

    if (!t.has(recipe.b)) {
      depth =
        (i.has(recipe.a) ? 0 : recipe.a.depth) +
        (i.has(recipe.b) || recipe.a == recipe.b ? 0 : recipe.b.depth);

      if (depth < lowestDepth) {
        lowestDepth = depth;
        bestRecipe = recipe;
      }
    }
  }

  return (
    bestRecipe || (!t.has(recipes[0].a) && !t.has(recipes[0].b) && recipes[0])
  );
}

async function getLineageSteps(
  icElementOrElements: ICElement | ICElement[],
  baseElements: ICElementWithDepth[],
): Promise<readonly [Step[], ICElementWithDepth[]]> {
  const icElements = Array.isArray(icElementOrElements)
    ? icElementOrElements
    : [icElementOrElements];

  const set__n = new Set<ICElement>(baseElements);
  const missingSet = new Set<ICElementWithDepth>();
  const set__s = new Set<ICElement>();
  const recipes: Step[] = [];

  const icElementToRecipeMap = new Map<ICElement, ICElementRecipe>();

  while (icElements.length) {
    const icElement = icElements.pop()!;
    const recipe = icElementToRecipeMap.get(icElement);

    if (set__n.has(icElement)) continue;

    if (recipe) {
      set__n.delete(recipe[0]);
      set__n.delete(recipe[1]);
    }

    const optimalRecipe = findOptimalRecipe(icElement.recipes, set__s, set__n);

    if (optimalRecipe) {
      if (set__n.has(optimalRecipe.a) && set__n.has(optimalRecipe.b)) {
        recipes.push([optimalRecipe.a, optimalRecipe.b, icElement]);
        set__s.delete(icElement);
        set__n.add(icElement);
      } else if (recipe) {
        recipes.push([recipe.a, recipe.b, icElement]);
        set__s.delete(icElement);
        set__n.add(recipe.a);
        set__n.add(recipe.b);
        set__n.add(icElement);
      } else {
        set__s.add(icElement);
        icElements.push(icElement);
        icElementToRecipeMap.set(icElement, optimalRecipe);
        if (!set__n.has(optimalRecipe.b)) icElements.push(optimalRecipe.b);
        if (!set__n.has(optimalRecipe.a)) icElements.push(optimalRecipe.a);
      }
    } else {
      missingSet.add(icElement);
      set__s.delete(icElement);
      set__n.add(icElement);
      if (recipes.length % 500 === 0) await new Promise(setTimeout);
    }
  }

  const missing = [...missingSet];

  return [recipes, missing] as const;
}

async function sortLineageSteps(
  steps: Step[],
  missing_elements: ICElementWithDepth[],
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
      if (!missing_elements.length) break;
      const r = missing_elements.reduce((e, t) => (t.depth < e.depth ? t : e));
      missing_elements.splice(missing_elements.indexOf(r), 1);
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
  icElementOrElements: ICElement | ICElement[],
  saveElements: ICElement[],
): Promise<{
  readonly lineage: Step[];
  readonly missing: ICElementWithDepth[];
}> {
  const { baseElements } = await precalculateElementDepths(saveElements);

  const [recipes, missing] = await getLineageSteps(
    icElementOrElements,
    baseElements,
  );

  const lineage = await sortLineageSteps(recipes, [...missing], baseElements);

  return { lineage, missing } as const;
}

export { precalculateElementDepths, generateLineage };
