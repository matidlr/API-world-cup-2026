interface PlayerOrderItem {
  position: string;
  shirtNumber: number;
  name: string;
}

/** Orders current on-field players by formation blocks (GK, DF, MF, FW). */
export function orderByFormattion<T extends PlayerOrderItem>(
  players: T[],
  formation?: string | null,
): T[] {
  const sourcePlayers = Array.isArray(players) ? [...players] : [];
  if (sourcePlayers.length <= 1) {
    return sourcePlayers;
  }

  const sortedPlayers = sourcePlayers.sort((leftPlayer, rightPlayer) => {
    const shirtDiff = toShirtNumber(leftPlayer.shirtNumber) - toShirtNumber(rightPlayer.shirtNumber);
    if (shirtDiff !== 0) {
      return shirtDiff;
    }

    return toNameKey(leftPlayer.name).localeCompare(toNameKey(rightPlayer.name));
  });

  const goalkeepers = sortedPlayers.filter((player) => toPositionKey(player.position) === 'GK');
  const defenders = sortedPlayers.filter((player) => toPositionKey(player.position) === 'DF');
  const midfielders = sortedPlayers.filter((player) => toPositionKey(player.position) === 'MF');
  const forwards = sortedPlayers.filter((player) => toPositionKey(player.position) === 'FW');
  const others = sortedPlayers.filter((player) => {
    const position = toPositionKey(player.position);
    return position !== 'GK' && position !== 'DF' && position !== 'MF' && position !== 'FW';
  });

  const formationSlots = parseFormationSlots(formation);
  const orderedPlayers: T[] = [];

  if (goalkeepers.length > 0) {
    orderedPlayers.push(...goalkeepers.splice(0, 1));
  }

  orderedPlayers.push(...defenders.splice(0, formationSlots.defenders));
  orderedPlayers.push(...midfielders.splice(0, formationSlots.midfielders));
  orderedPlayers.push(...forwards.splice(0, formationSlots.forwards));

  const remainingPlayers = [
    ...goalkeepers,
    ...defenders,
    ...midfielders,
    ...forwards,
    ...others,
  ];

  return [...orderedPlayers, ...remainingPlayers];
}

function parseFormationSlots(formation?: string | null): {
  defenders: number;
  midfielders: number;
  forwards: number;
} {
  const normalizedFormation = (formation ?? '').trim();
  const numericBlocks = normalizedFormation
    .split('-')
    .map((block) => Number.parseInt(block.trim(), 10))
    .filter((block) => Number.isFinite(block) && block > 0);

  if (numericBlocks.length === 0) {
    return { defenders: 4, midfielders: 4, forwards: 2 };
  }

  const defenders = numericBlocks[0] ?? 4;
  const forwards = numericBlocks[numericBlocks.length - 1] ?? 2;
  const midfielders =
    numericBlocks.length > 2
      ? numericBlocks.slice(1, -1).reduce((sum, value) => sum + value, 0)
      : Math.max(0, 10 - defenders - forwards);

  return { defenders, midfielders, forwards };
}

function toPositionKey(position?: string | null): string {
  return (position ?? '').trim().toUpperCase();
}

function toShirtNumber(shirtNumber?: number | null): number {
  if (typeof shirtNumber !== 'number' || !Number.isFinite(shirtNumber)) {
    return Number.MAX_SAFE_INTEGER;
  }

  return Math.max(0, Math.trunc(shirtNumber));
}

function toNameKey(name?: string | null): string {
  return (name ?? '').trim().toLowerCase();
}
