import type { ICItemData } from "@infinite-craft/dom-types";
import type { ICElement } from "savefile.js";

const state = {
  baseElementsString: ["Water", "Fire", "Wind", "Earth"] as const,
  baseElementsId: null, // gets updated in `loadElements`

  recipesIngIC: new Map<string, number>(), // "Water=Water" => "Lake"
  recipesResIC: [], // "Lake" => ["Water", "Water"]
  recipesUsesIC: [], // "Water" => ["Water", "Lake"]
  elementHeur: [], // "Lake" => 1

  nonExistentIcCaseId: 0,
  icCasedLookup: [],
  elementIdToText: [], // 1 => "Fire"
  elementTextToId: new Map<string, number>(), // "Fire" => 1
};

const alphabet = [
  ["Water", "Earth", "Plant"],
  ["Earth", "Plant", "Tree"],
  ["Water", "Tree", "River"],
  ["Earth", "River", "Delta"],
  ["Tree", "River", "Paper"],
  ["Paper", "Paper", "Book"],
  ["Book", "Delta", "Alphabet"],
];
const punc = [
  ...alphabet,
  ["Alphabet", "Alphabet", "Word"],
  ["Word", "Word", "Sentence"],
  ["Wind", "Sentence", "Phrase"],
  ["Book", "Phrase", "Quote"],
  ["Alphabet", "Quote", "Punctuation"],
];
const alphabetSoup = [
  ...punc,
  ["Punctuation", "Quote", "Apostrophe"],
  ["Apostrophe", "Quote", "Quotation Mark"],
  ["Fire", "Alphabet", "Alphabet Soup"],
  ["Alphabet Soup", "Quotation Mark", '"Alphabet Soup"'],
];
const rip = [
  ...alphabetSoup,
  ["Word", "Wind", "Whisper"],
  ["Earth", "Whisper", "Grave"],
  ['"Alphabet Soup"', "Grave", '"R.I.P."'],
];
const defaultPresets = [
  { name: "Alphabet", goals: ["Alphabet"], required: alphabet },
  {
    name: "Punctuation",
    goals: ["Punctuation", "Quote", "Alphabet"],
    required: punc,
  },
  {
    name: '"Alphabet Soup"',
    goals: ['"Alphabet Soup"', "Punctuation", "Quote", "Alphabet"],
    required: alphabetSoup,
  },
  {
    name: '"R.I.P"',
    goals: ['"R.I.P."', '"Alphabet Soup"', "Punctuation", "Quote", "Alphabet"],
    required: rip,
  },
];

window.addEventListener("load", () => {
  const v_container = document.querySelector(".container").__vue__;
  const addAPI = v_container.addAPI;
  v_container.addAPI = function () {
    // elements loaded!!!
    setTimeout(loadElements, 0);
    v_container.addAPI = addAPI;
    return addAPI.apply(this, arguments);
  };

  const switchSave = v_container.switchSave;
  v_container.switchSave = function () {
    loadDataAfterFinishLoading();
    return switchSave.apply(this, arguments);
  };
  const uploadSave = v_container.uploadSave;
  v_container.uploadSave = function () {
    loadDataAfterFinishLoading();
    return uploadSave.apply(this, arguments);
  };
  function loadDataAfterFinishLoading() {
    const intervalId = setInterval(() => {
      if (!v_container.isLoading) {
        clearInterval(intervalId);
        console.log("finished", IC.getItems());
        loadElements();
      }
    }, 10);
  }

  // add helper recipeModal stuff
  if (window?.ICHelper?.recipeModalTabs)
    window.ICHelper.recipeModalTabs.set("lineages", {
      renderBody: helperRenderBody,
      renderFooter: helperRenderFooter,
    });
  else
    alert(
      "Lineage Generator\nThe newest version of Helper is required to display lineages ingame!",
    );

  // listen for crafts
  const craft = v_container.craft;
  v_container.craft = async function () {
    const response = await craft.apply(this, arguments);
    setTimeout(() => {
      if (!response || !response.instance) return;
      addElement(response.instance.text, response.instance.id);

      const newRecipe = [
        icCaseId(arguments[0].itemId),
        icCaseId(arguments[1].itemId),
        icCaseId(response.instance.id),
      ];
      const newHeurForR =
        (state.elementHeur[newRecipe[0]] ?? Infinity) +
        (state.elementHeur[newRecipe[1]] ?? Infinity) +
        1;
      if ((state.elementHeur[newRecipe[2]] ?? Infinity) > newHeurForR) {
        state.elementHeur[newRecipe[2]] = newHeurForR;
        // Now, propagate this change:
        generateElementHeuristics([newRecipe[2]]);
      }
      addRecipe(...newRecipe);
    });
    return response;
  };

  // this event listener was added before helpers listener, so it also registers stuff earlier MUhaHAHAHAHA
  window.addEventListener(
    "contextmenu",
    (e) => {
      if (!e.target || !e.target.closest) return;
      const goalItem = e.target.closest(
        ".lineage-goals-container .lineage-goal",
      );
      if (goalItem) {
        e.preventDefault();
        e.stopImmediatePropagation();
        goalItem.dispatchEvent(new Event("remove-goal"));
      }
    },
    true,
  );
});

function addElement(text: string, id: number): void {
  state.elementIdToText[id] = text;
  state.elementTextToId.set(text, id);
}

function addRecipe(first: number, second: number, result: number): void {
  if (
    !Number.isInteger(first) ||
    !Number.isInteger(second) ||
    !Number.isInteger(result)
  )
    return;
  const F = icCaseId(first);
  const S = icCaseId(second);
  const R = icCaseId(result);
  if (F === R || S === R) return;

  const sortedFS = S > F ? [F, S] : [S, F];
  const combString = sortedFS.join("=");
  state.recipesIngIC.set(combString, result);

  pushToArrayArray(state.recipesResIC, R, sortedFS);
  pushToArrayArray(state.recipesUsesIC, F, [S, R]);
  if (F !== S) pushToArrayArray(state.recipesUsesIC, S, [F, R]);
}
function pushToArrayArray(arr, key, value) {
  let a = arr[key];
  if (!a) arr[key] = [value];
  else a.push(value);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function icCaseText(inputText: string) {
  if (!inputText) return undefined;

  let resultText = "";
  const len = inputText.length;
  for (let i = 0; i < len; i++) {
    resultText +=
      i === 0 || inputText[i - 1] === " "
        ? inputText[i].toUpperCase()
        : inputText[i].toLowerCase();
  }
  return resultText;
}
function icCaseId(inputId: number): number {
  const mapOutput = state.icCasedLookup[inputId];
  if (mapOutput !== undefined) return mapOutput;

  const inputText = state.elementIdToText[inputId];
  const resultText = icCaseText(inputText);

  let resultId = state.elementTextToId.get(resultText);
  if (resultId === undefined) {
    // example: it is `End Of Sentence` but the user only has `End of Sentence`...
    resultId = state.nonExistentIcCaseId++;
    addElement(resultText, resultId);
  }
  state.icCasedLookup[inputId] = resultId;
  return resultId;
}

async function* generateLineageMultipleMethods(goals) {
  const lineageGenerators = {
    Simple: async () => await generateLineage(goals),
    "Normal Recalc": async () => await generateLineage(goals, 1),
    "Reverse Recalc": async () => await generateLineage(goals, 2),
    "Min Recalc": async () => await generateLineage(goals, 3),
    "Max Recalc": async () => await generateLineage(goals, 4),
    "Random Recalc": async () => await generateLineage(goals, 5),
  };

  // Now iterate through the generators and run them
  for (const [methodName, generateFunc] of Object.entries(lineageGenerators)) {
    console.time(methodName);
    const { lineage, missingElements } = await generateFunc();

    const groupName = [
      `%c${methodName}:`,
      "background:green; color:white",
      `${lineage.length}-step`,
    ];
    console.groupCollapsed(...groupName);
    console.log(idLineageToText(lineage, goals));
    console.timeEnd(methodName);
    console.groupEnd();

    yield { lineage, methodName, missingElements };
  }
}

function generateElementHeuristics(
  startElements,
  heurMap = state.elementHeur,
  end = Infinity,
) {
  const pq = new PriorityQueue((a, b) => b[0] > a[0]);

  for (const startElement of startElements) {
    const heur = heurMap[startElement];
    if (heur === undefined)
      throw new Error(`${startElement} does not have a heur.`);
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

function findBestRecipeHeur(recipesArr, heurMap = state.elementHeur) {
  let bestMax = Infinity,
    bestMin = Infinity,
    bestRecipe = recipesArr[0];

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

async function generateLineage(goals, recalc: false | number = false) {
  const elementQueue = [...goals];
  const crafted = new Set();
  const visitedLastPath = new Map(); // for invalid lineages with infinite loops
  const heurMap = [...state.elementHeur];
  const lineage = [];

  while (elementQueue.length > 0) {
    const element = elementQueue.pop();
    if (crafted.has(element)) continue;

    const elementRecipesArr = state.recipesResIC[element];
    if (elementRecipesArr === undefined) {
      // no recipe found, add as missing
      crafted.add(element);
      continue;
    }
    let bestRecipe = findBestRecipeHeur(elementRecipesArr, heurMap);

    if (recalc === 2) bestRecipe = [bestRecipe[1], bestRecipe[0]];
    else if (recalc === 3 && heurMap[bestRecipe[0]] > heurMap[bestRecipe[1]])
      bestRecipe = [bestRecipe[1], bestRecipe[0]];
    else if (recalc === 4 && heurMap[bestRecipe[0]] < heurMap[bestRecipe[1]])
      bestRecipe = [bestRecipe[1], bestRecipe[0]];
    else if (recalc === 5 && Math.round(Math.random()))
      bestRecipe = [bestRecipe[1], bestRecipe[0]];

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
      lineage.push([...bestRecipe, element]);
      crafted.add(element);
      heurMap[element] = 0;

      if (recalc && elementQueue.length > 0) {
        const worst = elementQueue.reduce(
          (best, el) => {
            const heur = heurMap[el];
            return heur > best.heur ? { element: el, heur } : best;
          },
          { element: undefined, heur: -Infinity },
        );

        // tiny sleep to let the ui update
        await sleep(0);
        generateElementHeuristics([element], heurMap, worst.heur);
      }
    }
  }
  return correctlyCapsAndOrderLineage(removeUnnecessary(lineage, goals), goals);
}

function removeUnnecessary(lineage, goals) {
  const resultIngMap = new Map(
    lineage.map((recipe) => [recipe[2], [recipe[0], recipe[1]]]),
  );
  const usedMap = new Map(lineage.map((recipe) => [recipe[2], new Set()]));
  for (const [f, s, r] of lineage) {
    if (!state.baseElementsId.includes(f)) usedMap.get(f)?.add(r);
    if (!state.baseElementsId.includes(s)) usedMap.get(s)?.add(r);
  }

  for (let i = lineage.length - 1; i >= 0; i--) {
    const [, , r] = lineage[i];
    if (goals.includes(r)) continue;
    // try to remove recipe step by rerouting other recipes

    const blacklist = getBlacklistRU(r, usedMap);
    const changes = [];

    let removeable = true;
    for (const use of usedMap.get(r)) {
      const replacementRecipe = state.recipesResIC[use].find(
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
      // we can remove r!!
      switchRecipeRU(r, undefined, resultIngMap, usedMap);
      for (const [changeR, changeIngs] of changes) {
        switchRecipeRU(changeR, changeIngs, resultIngMap, usedMap);
      }
    }
  }

  return [...resultIngMap.entries()].map(([result, ings]) => [
    ings[0],
    ings[1],
    result,
  ]);
}

function getBlacklistRU(element, usedMap) {
  const blacklist = new Set([element]);
  for (const blackElement of blacklist) {
    for (const use of usedMap.get(blackElement)) {
      blacklist.add(use);
    }
  }
  return blacklist;
}

function switchRecipeRU(result, newRecipe, resultIngMap, usedMap) {
  const originalRecipe = resultIngMap.get(result);
  for (const x of originalRecipe)
    if (!state.baseElementsId.includes(x)) usedMap.get(x)?.delete(result);

  if (!newRecipe) resultIngMap.delete(result);
  else {
    resultIngMap.set(result, newRecipe);
    for (const x of newRecipe)
      if (!state.baseElementsId.includes(x)) usedMap.get(x).add(result);
  }
}

function correctlyCapsAndOrderLineage(lineage, goals) {
  const resultIngMap = new Map(
    lineage.map((recipe) => [recipe[2], [recipe[0], recipe[1]]]),
  );
  const elementQueue = [...goals];
  const crafted = new Set();
  const capsMap = new Map();
  const missingElements = [];
  const newLineage = [];

  while (elementQueue.length > 0) {
    const element = elementQueue.pop();
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
        [recipe[0], recipe[1]].sort((a, b) => a - b).join("="),
      );
      capsMap.set(element, actualResult);
      const newRecipe = [recipe[0], recipe[1], element].map(
        (x) => capsMap.get(x) ?? x,
      );
      if (
        state.elementIdToText[newRecipe[0]] >
        state.elementIdToText[newRecipe[1]]
      ) {
        [newRecipe[0], newRecipe[1]] = [newRecipe[1], newRecipe[0]];
      }
      newLineage.push(newRecipe);
    } else elementQueue.push(element, ...neededIngs);
  }
  return { lineage: newLineage, missingElements };
}

function helperRenderFooter(container, item) {
  container.appendChild(document.createTextNode(`Lineage`));
}

async function helperRenderBody(container, item) {
  const goalId = icCaseId(state.elementTextToId.get(item.text));
  if (goalId === undefined) {
    container.appendChild(
      document.createTextNode(`${item.text} is not in your save...`),
    );
    return container;
  }

  let goals = [goalId];
  let startTime, generator, lineage, methodName, missingElements;

  const goalsContainerContainerDiv = document.createElement("div");
  goalsContainerContainerDiv.classList.add("lineage-goals-container-container");
  const goalsContainerDiv = document.createElement("div");
  goalsContainerDiv.classList.add("lineage-goals-container");
  const addGoalInput = document.createElement("input");
  addGoalInput.type = "text";
  addGoalInput.classList.add("lineage-goals-input");
  addGoalInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      processNewGoalElements([addGoalInput.value]);
    }
  });

  // --- Dropdown Menu ---
  const dropdownContainer = document.createElement("div");
  dropdownContainer.classList.add("lineage-dropdown");

  const dropdownMenuBtn = document.createElement("button");
  dropdownMenuBtn.classList.add("lineage-action-button");
  dropdownMenuBtn.textContent = "☰";
  // Close dropdown when clicking outside
  document.addEventListener("click", () =>
    dropdownContent.classList.remove("show"),
  );
  dropdownMenuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    renderMainMenu();
    dropdownContent.classList.toggle("show");
  });

  const dropdownContent = document.createElement("div");
  dropdownContent.classList.add("lineage-dropdown-content");

  // Option 1: Copy Goals
  const optCopy = document.createElement("div");
  optCopy.classList.add("lineage-dropdown-item");
  optCopy.textContent = "Copy Goals";
  optCopy.addEventListener("click", () => {
    navigator.clipboard
      .writeText(
        goals.map((goalId) => idToMostlyNealCase(goalId).text).join("\n"),
      )
      .then(() => {
        optCopy.style.color = "gold";
        setTimeout(() => (optCopy.style.color = ""), 500);
      })
      .catch(() => alert("Failed to copy goals."));
  });

  // Option 2: Paste Goals
  const optPaste = document.createElement("div");
  optPaste.classList.add("lineage-dropdown-item");
  optPaste.textContent = "Paste Goals";
  optPaste.addEventListener("click", async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) processNewGoalElements(text.split("\n"));
    } catch {
      alert(
        "Failed to read clipboard text. Please ensure clipboard permissions are granted.",
      );
    }
  });

  // Option 3: Add Random Goal
  const optRandom = document.createElement("div");
  optRandom.classList.add("lineage-dropdown-item");
  optRandom.textContent = "Add random goal";
  optRandom.addEventListener("click", () => {
    const items = window.IC.getItems();
    if (items.length > 0) {
      const randomItem = items[Math.floor(Math.random() * items.length)];
      processNewGoalElements([randomItem.text]);
    }
  });

  // Option 4: Add Worst Element
  const optWorstElement = document.createElement("div");
  optWorstElement.classList.add("lineage-dropdown-item");
  optWorstElement.textContent = "Add worst element";
  optWorstElement.addEventListener("click", () => {
    const maxHeurId = state.elementHeur.reduce(
      (m, n, i) => (n > (state.elementHeur[m] ?? -Infinity) ? i : m),
      -1,
    );
    const maxHeurItem = idToMostlyNealCase(maxHeurId);
    if (maxHeurItem) processNewGoalElements([maxHeurItem.text]);
  });

  // Option 5: Add Best Seed
  const optBestSeed = document.createElement("div");
  optBestSeed.classList.add("lineage-dropdown-item");
  optBestSeed.textContent = "Add best seed";
  optBestSeed.addEventListener("click", () => {
    alertOnMissingRecipes(defaultPresets[1].required, true);
    processNewGoalElements(defaultPresets[1].goals);
  });

  // Option 6: Seed Presets
  const optPresets = document.createElement("div");
  optPresets.classList.add("lineage-dropdown-item");
  optPresets.textContent = "Other Seeds...";
  optPresets.style.borderTop = "1px solid var(--border-color, #333)";
  optPresets.addEventListener("click", (e) => {
    e.stopPropagation();
    renderPresetsMenu();
  });

  function renderMainMenu() {
    dropdownContent.innerHTML = "";
    dropdownContent.append(
      optCopy,
      optPaste,
      optRandom,
      optWorstElement,
      optBestSeed,
      optPresets,
    );
  }

  function renderPresetsMenu() {
    dropdownContent.innerHTML = "";

    // Back button
    const backBtn = document.createElement("div");
    backBtn.classList.add("lineage-dropdown-item");
    backBtn.textContent = "↩";
    backBtn.style.borderBottom = "1px solid var(--border-color, #333)";
    backBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      renderMainMenu();
    });
    dropdownContent.append(backBtn);

    const userPresets = JSON.parse(GM_getValue("lineage_seed_presets", "[]"));
    defaultPresets.forEach((p) => addPreset(p));
    userPresets.forEach((p, i) => addPreset(p, i));

    function addPreset(p, deleteIndex) {
      const wrapper = document.createElement("div");
      wrapper.classList.add("lineage-dropdown-item");
      wrapper.style.padding = "0";
      wrapper.addEventListener("click", () => {
        if (p.required) alertOnMissingRecipes(p.required, true);
        processNewGoalElements(p.goals);
        dropdownContent.classList.remove("show");
        renderMainMenu();
      });

      const presetItem = document.createElement("div");
      presetItem.classList.add("lineage-dropdown-item");
      presetItem.textContent = p.name;
      wrapper.append(presetItem);

      if (deleteIndex) {
        const deleteButton = document.createElement("button");
        deleteButton.classList.add("lineage-action-button");
        deleteButton.textContent = "✖";
        deleteButton.style.color = "crimson";
        deleteButton.addEventListener("click", (e) => {
          e.stopPropagation();
          if (confirm(`You actually want to delete '${p.name}'??!`)) {
            userPresets.splice(deleteIndex, 1);
            GM_setValue("lineage_seed_presets", JSON.stringify(userPresets));
            renderPresetsMenu();
          }
        });
        wrapper.append(deleteButton);
      }

      dropdownContent.append(wrapper);
    }

    // + Current Goals button
    const addCurrentBtn = document.createElement("div");
    addCurrentBtn.classList.add("lineage-dropdown-item");
    addCurrentBtn.style.borderTop = "1px solid var(--border-color, #333)";
    addCurrentBtn.style.color = "cyan";
    addCurrentBtn.textContent = "+ Add current goals";
    addCurrentBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (goals.length === 0) return alert("No goals to save :((");
      const name =
        prompt("Enter a name for this preset:") ||
        idToMostlyNealCase(goals[0]).text;
      const currentGoalsText = goals.map((id) => idToMostlyNealCase(id).text);
      userPresets.push({ name: name, goals: currentGoalsText });
      GM_setValue("lineage_seed_presets", JSON.stringify(userPresets));
      renderPresetsMenu();
    });

    dropdownContent.append(addCurrentBtn);
  }
  dropdownContainer.append(dropdownMenuBtn, dropdownContent);
  goalsContainerContainerDiv.append(
    goalsContainerDiv,
    addGoalInput,
    dropdownContainer,
  );

  const lineageHeaderDiv = document.createElement("div");
  lineageHeaderDiv.classList.add("lineage-header");

  const lineageTitle = document.createTextNode("");

  const copyLineageButton = document.createElement("button");
  copyLineageButton.classList.add("lineage-action-button");
  copyLineageButton.textContent = "Copy";
  let copyResetTimeout;
  copyLineageButton.addEventListener("click", () => {
    navigator.clipboard
      .writeText(idLineageToText(lineage, goals))
      .then(() => {
        copyLineageButton.style.borderColor = "lime";
        clearTimeout(copyResetTimeout);
        copyResetTimeout = setTimeout(() => {
          // revert to original
          copyLineageButton.style.borderColor = "";
        }, 500);
      })
      .catch(() => alert("Failed to copy lineage."));
  });

  const optimiseButton = document.createElement("button");
  optimiseButton.classList.add("lineage-action-button");
  optimiseButton.textContent = "Optimise";
  optimiseButton.addEventListener("click", async () => {
    optimiseButton.style.pointerEvents = "none";
    optimiseButton.style.transition = "none";
    optimiseButton.style.borderColor = "cyan";

    startTime = performance.now();
    let methodIndex = 0;
    optimiseButton.textContent = `Optimising... (${methodIndex++}/5)`;
    let goalsSnapshot = [...goals];

    for await (const {
      lineage: newLineage,
      methodName: newMethodName,
      missingElements: newMissingElements,
    } of generator) {
      if (
        !container.checkVisibility() ||
        goals.join("\n") != goalsSnapshot.join("\n")
      )
        return;

      if (
        newLineage.length < lineage.length ||
        (newLineage.length === lineage.length &&
          newMissingElements.length < missingElements.length)
      ) {
        lineage = newLineage;
        methodName = newMethodName;
        missingElements = newMissingElements;
        drawLineage();
      }
      optimiseButton.textContent = `Optimising... (${methodIndex++}/5)`;
      updateHeaderStatText();
    }
    optimiseButton.textContent = "Optimised";
    optimiseButton.style.opacity = "0.2";
    optimiseButton.style.transition = "";
    optimiseButton.style.borderColor = "";
  });

  lineageHeaderDiv.append(lineageTitle, optimiseButton, copyLineageButton);

  const lineageBodyDiv = document.createElement("div");
  lineageBodyDiv.classList.add("lineage-body");
  container.append(
    goalsContainerContainerDiv,
    lineageHeaderDiv,
    lineageBodyDiv,
  );

  drawGoalsAndInitLineage();

  function processNewGoalElements(newGoals: string[]) {
    let update = false;
    for (const newGoal of newGoals) {
      const icGoalText = icCaseText(newGoal.trim());
      const newItemId = state.elementTextToId.get(icGoalText);
      if (newItemId !== undefined && !goals.includes(newItemId)) {
        addGoalInput.value = "";
        goals.push(newItemId);
        update = true;
      }
    }
    if (update) {
      drawGoalsAndInitLineage();
    }
  }

  function drawGoalsAndInitLineage() {
    goalsContainerDiv.innerHTML = "";
    optimiseButton.style.borderColor = "";
    initializeLineage();

    goals.forEach((goalId, index) => {
      const goalItem = idToMostlyNealCase(goalId);
      const goalElement = window.ICHelper.createItemElement(goalItem);
      goalElement.classList.add("lineage-goal");

      goalElement.dataset.goalId = goalId; // Store goalId for easy access
      goalElement.dataset.index = index; // Store original index
      goalElement.addEventListener("remove-goal", (e) => {
        goals.splice(e.target.dataset.index, 1);
        drawGoalsAndInitLineage();
      });

      // prevent helper behaviour
      goalElement.addEventListener(
        "mousedown",
        (e) => e.stopImmediatePropagation(),
        true,
      );

      goalElement.draggable = true;
      goalElement.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", goalId);
        e.dataTransfer.setData("sourceIndex", index);
        e.target.classList.add("dragging");
        setTimeout(() => (e.target.style.visibility = "hidden"), 0);
      });
      goalElement.addEventListener("dragend", (e) => {
        e.target.classList.remove("dragging");
        e.target.style.visibility = "visible";
      });
      goalElement.addEventListener("dragover", (e) => {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = "move";
      });
      goalElement.addEventListener("drop", (e) => {
        e.preventDefault();
        const sourceIndex = parseInt(e.dataTransfer.getData("sourceIndex"), 10);
        const targetIndex = index;

        if (sourceIndex !== targetIndex) {
          // Reorder the `goals` array
          const [movedItem] = goals.splice(sourceIndex, 1); // Remove item from old position
          goals.splice(targetIndex, 0, movedItem); // Insert item at new position
          drawGoalsAndInitLineage();
        }
      });

      goalsContainerDiv.append(goalElement);
    });
    addGoalInput.placeholder = `Add goal... (${goals.length})`;
  }

  async function initializeLineage() {
    startTime = performance.now();
    generator = generateLineageMultipleMethods(goals);
    const result = (await generator.next()).value;
    lineage = result.lineage;
    methodName = result.methodName;
    missingElements = result.missingElements;
    updateHeaderStatText();
    drawLineage();
    optimiseButton.textContent = "Optimise";
    optimiseButton.style.opacity = "";
    optimiseButton.style.pointerEvents = "";
  }

  function drawLineage() {
    lineageBodyDiv.innerHTML = "";

    if (missingElements.length > 0) {
      const missingContainerContainerDiv = document.createElement("div");
      missingContainerContainerDiv.classList.add(
        "lineage-missing-container-container",
      );
      const missingContaierDiv = document.createElement("div");
      missingContaierDiv.classList.add("lineage-missing-container");
      for (const missingElement of missingElements) {
        const missingItem = idToMostlyNealCase(missingElement);
        const missingItemElement =
          window.ICHelper.createItemElement(missingItem);
        missingItemElement.classList.add("lineage-missing");
        missingContaierDiv.append(missingItemElement);
      }
      missingContainerContainerDiv.append(
        document.createTextNode("Missing:"),
        missingContaierDiv,
      );
      lineageBodyDiv.append(missingContainerContainerDiv);
    }

    lineage.forEach((r, step) => {
      const recipe = document.createElement("div");
      recipe.classList.add("recipe");
      const [first, second, result] = r.map((x) =>
        window.ICHelper.idMap.get(x),
      );
      if (!first || !second || !result)
        console.warn(
          "Invalid recipe for " + r.map((x) => state.elementIdToText[x]),
          r,
        );
      else {
        const stepNumberSpan = document.createElement("span");
        stepNumberSpan.classList.add("recipe-step-number");
        stepNumberSpan.textContent = `${step + 1}.`;

        const firstItemElement = window.ICHelper.createItemElement(first);
        const secondItemElement = window.ICHelper.createItemElement(second);
        const resultItemElement = window.ICHelper.createItemElement(result);
        if (missingElements.includes(icCaseId(first.id)))
          firstItemElement.classList.add("lineage-missing");
        if (missingElements.includes(icCaseId(second.id)))
          secondItemElement.classList.add("lineage-missing");
        if (missingElements.includes(icCaseId(result.id)))
          resultItemElement.classList.add("lineage-missing");
        else if (goals.includes(icCaseId(result.id)))
          resultItemElement.classList.add("lineage-goal");

        recipe.append(
          stepNumberSpan,
          firstItemElement,
          document.createTextNode("+"),
          secondItemElement,
          document.createTextNode("→"),
          resultItemElement,
        );
        lineageBodyDiv.append(recipe);
      }
    });
  }
  function updateHeaderStatText() {
    lineageTitle.textContent = `${methodName} - ${lineage.length} Steps (${((performance.now() - startTime) / 1000).toFixed(3)} s)`;
  }
  return container;
}

function idToMostlyNealCase(itemId) {
  let item = window.ICHelper.idMap.get(itemId);
  if (item) return item;
  // example: it is `End Of Sentence` but the user only has `End of Sentence`...
  const itemLowerText = state.elementIdToText[itemId].toLowerCase();
  return window.IC.getItems().find(
    (x) => x.text.toLowerCase() === itemLowerText,
  );
}

function textLineageToArray(input) {
  if (Array.isArray(input)) return input;
  return input
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [fs, r] = line
        .split(/ \/\/| ::/)[0]
        .split(" = ")
        .map((x) => x.trim());
      const [f, s] = [
        fs.slice(0, fs.indexOf(" + ")),
        fs.slice(fs.indexOf(" + ") + 3),
      ].map((x) => x.trim());
      return [f, s, r];
    });
}

function textArrayLineageToString(input) {
  if (typeof input === "string") return input;

  // Handle both 3D arrays (alt lineages) and 2D arrays (single lineage)
  const is3D = Array.isArray(input[0]) && Array.isArray(input[0][0]);
  return (is3D ? input : [input])
    .map((lineage) =>
      lineage
        .map(
          (x) =>
            `${[x[0], x[1]].sort()[0]} + ${[x[0], x[1]].sort()[1]} = ${x[2]}`,
        )
        .join("\n"),
    )
    .join("\n\n");
}

function idLineageToText(lineage, goals) {
  return lineage
    .map((recipe, i) => {
      const [first, second] = [
        state.elementIdToText[recipe[0]],
        state.elementIdToText[recipe[1]],
      ].sort();
      const result = state.elementIdToText[recipe[2]];
      return (
        `${first} + ${second} = ${result}` +
        (goals.includes(icCaseId(recipe[2])) ? `  // ${i + 1}` : "")
      );
    })
    .join("\n");
}

function alertOnMissingRecipes(input, alertPopup) {
  let missing = new Set();
  for (const [first, second, res] of textLineageToArray(input)) {
    const id1 = state.elementTextToId.get(icCaseText(first));
    const id2 = state.elementTextToId.get(icCaseText(second));
    const idRes = state.elementTextToId.get(icCaseText(res));

    const sortedFS = id2 > id1 ? [id1, id2] : [id2, id1];
    if (icCaseId(state.recipesIngIC.get(sortedFS.join("="))) !== idRes) {
      missing.add(`${first} + ${second} = ${res}`);
    }
  }
  if (alertPopup) {
    if (missing.size) alert("You are missing:\n\n" + [...missing].join("\n"));
  } else {
    console.log(
      "%cMissing:",
      "background: orange; color: white",
      missing.size > 0
        ? `\n` + [...missing].join(`\n`)
        : "No missing recipes, yay!",
    );
    return [...missing];
  }
}

async function generateLineage(...goals) {
  goals = goals.map((goal) => {
    const goalId = state.elementTextToId.get(icCaseText(goal));
    if (goalId === undefined) throw new Error(`${goal} is not in your save...`);
    return goalId;
  });

  let bestResult = null;
  for await (const lineage of generateLineageMultipleMethods(goals)) {
    if (!bestResult || lineage.lineage.length < bestResult.lineage.length) {
      bestResult = lineage;
    }
  }
  return bestResult;
}

// Priority Queue - https://stackoverflow.com/a/42919752
const pqTop = 0;
const pqParent = (i) => ((i + 1) >>> 1) - 1;
const pqLeft = (i) => (i << 1) + 1;
const pqRight = (i) => (i + 1) << 1;

class PriorityQueue {
  constructor(comparator = (a, b) => a > b) {
    this._heap = [];
    this._comparator = comparator;
  }
  size() {
    return this._heap.length;
  }
  isEmpty() {
    return this.size() == 0;
  }
  peek() {
    return this._heap[pqTop];
  }
  push(...values) {
    values.forEach((value) => {
      this._heap.push(value);
      this._siftUp();
    });
    return this.size();
  }
  pop() {
    const poppedValue = this.peek();
    const bottom = this.size() - 1;
    if (bottom > pqTop) {
      this._swap(pqTop, bottom);
    }
    this._heap.pop();
    this._siftDown();
    return poppedValue;
  }
  replace(value) {
    const replacedValue = this.peek();
    this._heap[pqTop] = value;
    this._siftDown();
    return replacedValue;
  }
  _greater(i, j) {
    return this._comparator(this._heap[i], this._heap[j]);
  }
  _swap(i, j) {
    [this._heap[i], this._heap[j]] = [this._heap[j], this._heap[i]];
  }
  _siftUp() {
    let node = this.size() - 1;
    while (node > pqTop && this._greater(node, pqParent(node))) {
      this._swap(node, pqParent(node));
      node = pqParent(node);
    }
  }
  _siftDown() {
    let node = pqTop;
    while (
      (pqLeft(node) < this.size() && this._greater(pqLeft(node), node)) ||
      (pqRight(node) < this.size() && this._greater(pqRight(node), node))
    ) {
      let maxChild =
        pqRight(node) < this.size() &&
        this._greater(pqRight(node), pqLeft(node))
          ? pqRight(node)
          : pqLeft(node);
      this._swap(node, maxChild);
      node = maxChild;
    }
  }
}

function loadElements(items: ICItemData[]): void {
  state.recipesIngIC = new Map();
  state.recipesResIC = [];
  state.recipesUsesIC = [];
  state.elementHeur = [];
  state.nonExistentIcCaseId = 0;
  state.icCasedLookup = [];
  state.elementIdToText = [];
  state.elementTextToId = new Map();

  for (const element of items) {
    addElement(element.text, element.id);
  }

  state.baseElementsId = state.baseElementsString.map((x) =>
    state.elementTextToId.get(x),
  );
  state.nonExistentIcCaseId = items.length + 20_000;

  for (const element of items) {
    for (const [fID, sID] of element.recipes ?? []) {
      addRecipe(fID, sID, element.id);
    }
  }

  for (const baseElement of state.baseElementsId)
    state.elementHeur[baseElement] = 0;

  generateElementHeuristics(state.baseElementsId);
}

function loadFromSavefile(elements: ICElement[]): void {
  return loadElements(
    elements.map((e) => ({
      text: e.text,
      id: e.id,
      recipes: e.recipes.map((r) => [r.a.id, r.b.id]),
    })),
  );
}

export { generateLineage, loadElements, loadFromSavefile };
