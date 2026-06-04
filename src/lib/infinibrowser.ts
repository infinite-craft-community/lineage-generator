import { Savefile, type ICElement, type ICElementRecipe } from "savefile.js";

type ICElementRecipeWithDepth = ICElementRecipe & {
  a: ICElementWithDepth;
  b: ICElementWithDepth;
};

type ICElementWithDepth = ICElement & {
  recipes: ICElementRecipeWithDepth[];
  depth: number;
};

type Step = [ICElement, ICElement, ICElement];

function findOptimalRecipe(
  recipes: ICElementRecipe[],
  t: Set<ICElement>,
  i: Set<ICElement>,
) {
  let lowestDepth = Infinity;
  let bestRecipe;
  let depth: number;

  if (recipes?.length) {
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
  e: Step[],
  missing_elements: ICElementWithDepth[],
  array__b: ICElementWithDepth[],
): Promise<Step[]> {
  const set__i = new Set(array__b);
  const set__n = new Set(e);
  const steps: Step[] = [];
  for (; set__n.size; ) {
    let e = 0;
    for (const step of set__n) {
      if (set__i.has(step[0]) && set__i.has(step[1])) {
        steps.push(step);
        set__n.delete(step);
        set__i.add(step[2]);
        e++;
      }
    }

    if (!e) {
      if (!missing_elements.length) break;
      const r = missing_elements.reduce((e, t) => (t.depth < e.depth ? t : e));
      missing_elements.splice(missing_elements.indexOf(r), 1);
      set__i.add(r);
    }
    if (steps.length % 500 == 0) await new Promise(setTimeout);
  }
  return steps;
}

async function calculateElementDepths(save: Savefile): Promise<void> {
  const saveElements = save.elements;

  const baseElements = saveElements.slice(0, 4);
  save.reverseRecipeMap.clear();

  await (async () => {
    let t = 0;
    for (const i of saveElements) i.depth = Infinity;

    for (const n of baseElements) n.depth = 0;

    while (true) {
      let number__n = 0;
      t++;
      for (const a of saveElements) {
        let e = a.depth;
        let t;
        let i;
        for (i of a.recipes) {
          t = i.a.depth + i.b.depth + 1;
          if (t < e) {
            e = t;
          }
        }
        if (a.depth > e) {
          a.depth = e;
          number__n++;
        }
      }
      if ((await new Promise(setTimeout), !number__n)) break;
    }
  })();
}

async function generateLineage(
  icElementOrElements: ICElement | ICElement[],
  save: Savefile,
): Promise<{
  readonly lineage: Step[];
  readonly missing: ICElementWithDepth[];
}> {
  calculateElementDepths(save);

  const saveElements = save.elements;
  const baseElements = saveElements.slice(0, 4) as ICElementWithDepth[];

  const [recipes, missing] = await getLineageSteps(
    icElementOrElements,
    baseElements,
  );

  const lineage = await sortLineageSteps(recipes, [...missing], baseElements);

  return { lineage, missing } as const;
}

export { generateLineage };
