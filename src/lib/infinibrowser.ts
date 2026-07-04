import type { ICElement } from "savefile.js";

import {
  generateLineage,
  type CalculateElementDepthsResult,
  type ICElementWithDepth,
} from "./infinibrowser/shared";

async function preCalculateElementDepths(saveElements: ICElement[]) {
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
