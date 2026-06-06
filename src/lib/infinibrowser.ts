import type { ICElement, ICElementRecipe } from "savefile.js";

type ICElementRecipeWithDepth = ICElementRecipe & {
  a: ICElementWithDepth;
  b: ICElementWithDepth;
};

type ICElementWithDepth = ICElement & {
  recipes: ICElementRecipeWithDepth[];
  depth: number;
};

export type Step = [ICElementWithDepth, ICElementWithDepth, ICElementWithDepth];

function findOptimalRecipe(
  recipes: ICElementRecipeWithDepth[],
  targetsSet: Set<ICElement>,
  achievedElementsSet: Set<ICElement>,
) {
  let lowestDepth = Infinity;
  let bestRecipe;

  const firstRecipe = recipes[0];

  if (!firstRecipe) return;

  for (const recipe of recipes) {
    if (targetsSet.has(recipe.a)) continue;

    if (!targetsSet.has(recipe.b)) {
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

  return (
    !targetsSet.has(firstRecipe.a) &&
    !targetsSet.has(firstRecipe.b) &&
    firstRecipe
  );
}

async function getLineageSteps(
  targets: ICElementWithDepth[],
  baseElements: ICElementWithDepth[],
): Promise<readonly [Step[], ICElementWithDepth[]]> {
  const achievedElementsSet = new Set<ICElement>(baseElements);
  const missingElementsSet = new Set<ICElementWithDepth>();
  const targetsSet = new Set<ICElement>();
  const recipes: Step[] = [];

  const targetToRecipeMap = new Map<ICElement, ICElementRecipeWithDepth>();

  while (targets.length) {
    const target = targets.pop()!;
    const targetRecipe = targetToRecipeMap.get(target);

    if (achievedElementsSet.has(target)) continue;

    const optimalRecipe = findOptimalRecipe(
      target.recipes,
      targetsSet,
      achievedElementsSet,
    );

    if (!optimalRecipe) {
      missingElementsSet.add(target);
      targetsSet.delete(target);
      achievedElementsSet.add(target);
      // @ts-expect-error
      if (recipes.length % 500 === 0) await new Promise(setTimeout);
      continue;
    }

    if (
      achievedElementsSet.has(optimalRecipe.a) &&
      achievedElementsSet.has(optimalRecipe.b)
    ) {
      recipes.push([optimalRecipe.a, optimalRecipe.b, target]);
      targetsSet.delete(target);
      achievedElementsSet.add(target);
    } else if (targetRecipe) {
      recipes.push([targetRecipe.a, targetRecipe.b, target]);
      targetsSet.delete(target);
      achievedElementsSet.add(targetRecipe.a);
      achievedElementsSet.add(targetRecipe.b);
      achievedElementsSet.add(target);
    } else {
      targetsSet.add(target);
      targets.push(target);
      targetToRecipeMap.set(target, optimalRecipe);
      if (!achievedElementsSet.has(optimalRecipe.b))
        targets.push(optimalRecipe.b);
      if (!achievedElementsSet.has(optimalRecipe.a))
        targets.push(optimalRecipe.a);
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

    // @ts-expect-error
    if (sortedSteps.length % 500 == 0) await new Promise(setTimeout);
  }
  return sortedSteps;
}

function pruneLineage(steps: Step[], targets: Set<ICElement>): void {
  const elementToStepMap = new Map<ICElementWithDepth, Step>();

  for (const step of steps) {
    if (!targets.has(step[2])) {
      elementToStepMap.set(step[2], step);
    }
    elementToStepMap.delete(step[0]);
    elementToStepMap.delete(step[1]);
  }

  if (elementToStepMap.size) {
    elementToStepMap.forEach((step) => {
      const idx = steps.indexOf(step);
      if (idx !== -1) {
        steps.splice(idx, 1);
      }
    });
    pruneLineage(steps, targets);
  }
}

interface GenerateLineageResult {
  readonly lineage: Step[];
  readonly missing: ICElementWithDepth[];
}

async function generateLineage(
  targets: ICElementWithDepth[],
  baseElements: ICElementWithDepth[],
): Promise<GenerateLineageResult> {
  const targetsSet = new Set<ICElement>(targets);
  const [recipes, missing] = await getLineageSteps(targets, baseElements);

  const lineage = await sortLineageSteps(recipes, [...missing], baseElements);

  pruneLineage(lineage, targetsSet);

  return { lineage, missing } as const;
}

interface CalculateElementDepthsResult {
  generateLineage(target: ICElement | ICElement[]): Promise<{
    readonly lineage: Step[];
    readonly missing: ICElementWithDepth[];
  }>;
}

async function calculateElementDepths(
  saveElements: ICElement[],
): Promise<CalculateElementDepthsResult> {
  const elements = saveElements as ICElementWithDepth[];
  const baseElements = elements.slice(0, 4);

  for (const element of elements) element.depth = Infinity;
  for (const baseElement of baseElements) baseElement.depth = 0;

  while (true) {
    let depthChanged = 0;
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
        depthChanged++;
      }
    }
    // @ts-expect-error
    await new Promise(setTimeout);
    if (!depthChanged) break;
  }

  return {
    generateLineage(target: ICElement | ICElement[]) {
      const targets = (
        Array.isArray(target) ? target : [target]
      ) as ICElementWithDepth[];

      return generateLineage(targets, baseElements);
    },
  };
}

export { calculateElementDepths, generateLineage };
