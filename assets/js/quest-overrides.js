// assets/js/quest-overrides.js - manual edits
//
// key a quest by any of these (first match wins):
//   "arcade_gamer"            the quest id (hover a quest row to see it)
//   "battleground|Name"       game key + name (when two games share a quest name)
//   "Name"                    just the name, without the "Daily Quest:" prefix
//
// Fields (all optional):
//   easy: true                shows the green "Easy" tag (and includes it in "Easy only")
//   name: "New name"          rename
//   desc: ["Line 1", "Line 2"]  replace the description; each array item is its own line (a string also works)
//   info: ["Line", "Line"]    adds an (i) hover with these lines
//   kind: "daily" | "weekly" | "special"   fix a quest that is in the wrong list
//   icon: "halloween"         use img/games/<icon>.png instead of the game icon
//   hide: true                remove it from the page
window.QUEST_OVERRIDES = {
  "warlords_objectives": {
    desc: ["Earn 100 points"],
    info: [
      "Points breakdown:",
      "30 points for kills/assists on the enemy flag carrier",
      "15 points for kills/assists near the allied flag carrier",
      "100 points for capturing a flag",
      "30 points for capturing a domination point",
      "5 points for TDM kills/assists"
    ]
  },
  "Faithful": {
    desc: ["Play 3 games of standard Mega Walls", "Win one game in standard"],
    info: ["The win needs at least one kill (standard mode)."]
  },
  "Harvest Season": {
    desc: ["Collect 333 souls from kills and wins in any mode", "Win 3 spooky games", "Win 10 games in any mode"],
    icon: "halloween"
  },

  // Examples:
  "arcade_winner": { easy: true },
  "arcade_gamer": { easy: true },
  "bedwars_daily_one_more": { easy: true },
};