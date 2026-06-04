import { Savefile } from "savefile.js";

import { generateLineage } from "./lib/infinibrowser";

const savefile = new Savefile();

const elementWater = savefile.addElement("Water", "💧");
const elementFire = savefile.addElement("Fire", "🔥");
const elementWind = savefile.addElement("Wind", "🌬️");
const elementEarth = savefile.addElement("Earth", "🌍");

const elementSteam = savefile.addElement("Steam", "💨");
const elementVolcano = savefile.addElement("Volcano", "🌋");
const elementSmoke = savefile.addElement("Smoke", "💨");
const elementLava = savefile.addElement("Lava", "🌋");
const elementWave = savefile.addElement("Wave", "🌊");

savefile.addRecipe(elementFire, elementWater, elementSteam);
savefile.addRecipe(elementFire, elementFire, elementVolcano);
savefile.addRecipe(elementFire, elementWind, elementSmoke);
savefile.addRecipe(elementEarth, elementFire, elementLava);
savefile.addRecipe(elementWater, elementWind, elementWave);

const { lineage } = await generateLineage(elementLava, savefile);

console.log(lineage.map((step) => step.map((item) => item.text)));
