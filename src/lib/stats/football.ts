function average(
  total: number,
  games: number
) {
  if (!games) return 0;

  return Number(
    (total / games).toFixed(1)
  );
}

export function calculateGPG(
  goals: number,
  games: number
) {
  return average(goals, games);
}

export function calculateAPG(
  assists: number,
  games: number
) {
  return average(assists, games);
}

export function calculateSPG(
  saves: number,
  games: number
) {
  return average(saves, games);
}

export function calculateCSG(
  cleanSheets: number,
  games: number
) {
  return average(cleanSheets, games);
}