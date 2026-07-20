function pushToArrayArray<T extends [unknown, unknown]>(
  arr: T[][],
  key: number,
  value: Readonly<T>,
): void {
  const a = arr[key];
  if (!a) arr[key] = [value];
  else a.push(value);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function icCaseText(inputText: string): string {
  let resultText = "";
  const len = inputText.length;

  for (let i = 0; i < len; i++) {
    resultText +=
      i === 0 || inputText[i - 1] === " "
        ? inputText[i]!.toUpperCase()
        : inputText[i]!.toLowerCase();
  }

  return resultText;
}

export { icCaseText, pushToArrayArray, sleep };
