export function parseGenericNames(text: string): string[] {
  const lines = text.split(/[\n,]/)
  return lines.map((l) => l.trim()).filter((l) => l.length > 0)
}

export function parseCsvFile(text: string): string[] {
  const lines = text.split(/\r?\n/)
  const names: string[] = []
  for (const line of lines) {
    const cells = line
      .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
      .map((c) => c.replace(/^"|"$/g, "").trim())
    for (const cell of cells) {
      if (cell.length > 0) names.push(cell)
    }
  }
  return names
}
