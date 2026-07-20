import type { ICElement } from "savefile.js";

import {
  generateLineage,
  type CalculateElementDepthsResult,
  type ICElementWithDepth,
} from "./shared";

async function preCalculateElementDepths(saveElements: ICElement[]) {
  const elements = saveElements as ICElementWithDepth[];
  const baseElements = elements.slice(0, 4);

  for (const element of elements) element.depth = Infinity;
  for (const baseElement of baseElements) baseElement.depth = 0;

  const usedIn = new Map<ICElementWithDepth, Set<ICElementWithDepth>>();
  for (const element of elements) {
    for (const recipe of element.recipes) {
      let owners = usedIn.get(recipe.a);
      if (!owners) {
        owners = new Set();
        usedIn.set(recipe.a, owners);
      }
      owners.add(element);

      if (recipe.a !== recipe.b) {
        owners = usedIn.get(recipe.b);
        if (!owners) {
          owners = new Set();
          usedIn.set(recipe.b, owners);
        }
        owners.add(element);
      }
    }
  }

  const queue: ICElementWithDepth[] = baseElements.slice();
  const pending = new Set<ICElementWithDepth>(queue);
  let head = 0;
  let updateCount = 0;
  const YIELD_EVERY = 900;

  while (head < queue.length) {
    const current = queue[head++]!;
    pending.delete(current);

    const owners = usedIn.get(current);
    if (!owners) continue;

    for (const owner of owners) {
      let minDepth = owner.depth;

      for (const recipe of owner.recipes) {
        const da = recipe.a.depth;
        const db = recipe.b.depth;
        if (da < Infinity && db < Infinity) {
          const total = da + db + 1;
          if (total < minDepth) minDepth = total;
        }
      }

      if (minDepth < owner.depth) {
        owner.depth = minDepth;
        updateCount++;

        if (!pending.has(owner)) {
          pending.add(owner);
          queue.push(owner);
        }

        if (updateCount % YIELD_EVERY === 0) {
          // @ts-expect-error
          await new Promise(setTimeout);
        }
      }
    }
  }

  return { baseElements };
}

async function calculateElementDepths(
  elements: ICElement[],
): Promise<CalculateElementDepthsResult> {
  const { baseElements } = await preCalculateElementDepths(elements);

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
