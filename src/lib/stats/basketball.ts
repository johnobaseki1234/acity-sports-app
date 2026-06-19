function average(
  total: number,
  games: number
) {
  if (!games) return 0;

  return Number(
    (total / games).toFixed(1)
  );
}

export function calculatePPG(
  points: number,
  games: number
) {
  return average(points, games);
}

export function calculateRPG(
  rebounds: number,
  games: number
) {
  return average(rebounds, games);
}

export function calculateAPG(
  assists: number,
  games: number
) {
  return average(assists, games);
}

export function calculateTPG(
  turnovers: number,
  games: number
) {
  return average(turnovers, games);
}

export function calculateFGPercent(
  made: number,
  attempts: number
) {
  if (!attempts) return 0;

  return Number(
    (
      (made / attempts) *
      100
    ).toFixed(1)
  );
}