export const cheats: Record<string, string[][]> = {
  noWin: [
    ["anubis", "horus", "thoth"],
    ["urn", "sphinx", "vase"],
    ["horusFalcon", "anubis", "crookAndFlail"],
    ["thoth", "urn", "horus"],
    ["vase", "scarab", "sphinx"],
  ],
  middleRowWin: [
    ["anubis", "urn", "urn"],
    ["horus", "thoth", "vase"],
    ["sphinx", "thoth", "anubis"],
    ["urn", "thoth", "horus"],
    ["vase", "crookAndFlail", "sphinx"],
  ],
  jackpot: [
    ["urn", "thoth", "vase"],
    ["horus", "thoth", "anubis"],
    ["sphinx", "thoth", "urn"],
    ["anubis", "thoth", "horus"],
    ["vase", "thoth", "sphinx"],
  ],
};
