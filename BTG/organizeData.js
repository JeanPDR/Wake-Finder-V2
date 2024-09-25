// organizeData.js
export function organizeData(rawData) {
  return rawData
    .replace(/:\s+/g, ": ")
    .split("\n")
    .map((line) => line.trim())
    .reduce((acc, line) => {
      if (line.includes(":")) {
        const [key, ...value] = line.split(": ");
        const joinedValue = value.join(": ");
        acc.push(`${key}: ${joinedValue.trim()}`);
      }
      return acc;
    }, [])
    .join("\n");
}
