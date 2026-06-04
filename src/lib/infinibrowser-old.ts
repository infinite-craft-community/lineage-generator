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

const findOptimalRecipe = (
  recipes: ICElementRecipe[],
  t: Set<ICElement>,
  i: Set<ICElement>,
) => {
  let lowestDepth = Infinity;
  let bestRecipe;
  let depth: number;

  if (recipes?.length) {
    for (const recipe of recipes) {
      if (!t.has(recipe.a)) {
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
    }

    return (
      bestRecipe || (!t.has(recipes[0].a) && !t.has(recipes[0].b) && recipes[0])
    );
  }
};

async function getLineageSteps(
  icElementOrElements: ICElement | ICElement[],
  array__b: ICElementWithDepth[],
  itemRecipes: ICElementRecipeWithDepth | null = null,
): Promise<readonly [Step[], ICElementWithDepth[]]> {
  const icElements = Array.isArray(icElementOrElements)
    ? icElementOrElements
    : [icElementOrElements];

  const set__n = new Set<ICElement>(array__b);
  const set__a = new Set<ICElementWithDepth>();
  const set__s = new Set<ICElement>();
  const recipes: Step[] = [];

  if (icElements.length === 1 && itemRecipes) {
    const xxx = icElements.pop()!;
    set__n.add(xxx);
    set__s.add(xxx);
    recipes.push([itemRecipes.a, itemRecipes.b, xxx]);
    if (!set__n.has(itemRecipes.a)) icElements.push(itemRecipes.a);
    if (!set__n.has(itemRecipes.b)) icElements.push(itemRecipes.b);
  }

  const icElementToRecipeMap = new Map<ICElement, ICElementRecipe>();

  while (icElements.length) {
    const var_d = icElements.pop()!;
    const c = icElementToRecipeMap.get(var_d);

    if (!(!set__n.has(var_d) && c)) continue;

    set__n.delete(c[0]);
    set__n.delete(c[1]);

    const o = findOptimalRecipe(var_d.recipes, set__s, set__n);

    if (o) {
      if (set__n.has(o.a) && set__n.has(o.b)) {
        recipes.push([o.a, o.b, var_d]);
        set__s.delete(var_d);
        set__n.add(var_d);
      } else if (c) {
        recipes.push([c.a, c.b, var_d]);
        set__s.delete(var_d);
        set__n.add(c.a);
        set__n.add(c.b);
        set__n.add(var_d);
      } else {
        set__s.add(var_d);
        icElements.push(var_d);
        icElementToRecipeMap.set(var_d, o);
        if (!set__n.has(o.b)) icElements.push(o.b);
        if (!set__n.has(o.a)) icElements.push(o.a);
      }
    } else {
      set__a.add(var_d);
      set__s.delete(var_d);
      set__n.add(var_d);
      if (recipes.length % 500 === 0) await new Promise(setTimeout);
    }
  }

  return [recipes, Array.from(set__a.keys())] as const;
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

  const array__b = saveElements.slice(0, 4);
  save.reverseRecipeMap.clear();

  await (async () => {
    let t = 0;
    for (const i of saveElements) i.depth = Infinity;
    for (const n of array__b) n.depth = 0;
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
  raw: Uint8Array<ArrayBuffer>,
) {
  const save = (await Savefile.decode(raw, {
    generateReverseRecipeMap: false,
  }))!;

  calculateElementDepths(save);

  const saveElements = save.elements;
  const array__b = saveElements.slice(0, 4);

  const [recipes, missing] = await getLineageSteps(
    icElementOrElements,
    array__b,
  );

  const lineage = await sortLineageSteps(recipes, [...missing], array__b);

  return { lineage, missing } as const;
}

export { generateLineage };
