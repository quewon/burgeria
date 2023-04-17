var playerdata = {
  tutorial: {},

  daytime: true,
  day: 1,
  storetime: -1,
  prices: {},
  recipes: [],
  trays: [],
  guys: [],

  points: 100,
  unbankedPoints: 0,
  bankbook: [],
  inventory: null,
  letters: {},
  ingredients: {},
  workshop: "",
  library: [],
  libraryIndex: 0,

  themes: {},
};

function bankPoints(value, description) {
  if (value == 0) return;

  playerdata.points += value;
  playerdata.bankbook.push([playerdata.day, description || "BURG", value < 0 ? value : "", value > 0 ? value : "", playerdata.points]);

  updateBankbook();
  updatePoints();
}

function init_default_playerdata() {
  playerdata.day = 1;
  playerdata.storetime = -1;
  playerdata.points = 100;
  playerdata.bankbook = [
    [0, "BURGERMAN", "", "100", "100"]
  ];

  playerdata.tutorial = {};
  for (let id in ui.tutorial) {
    playerdata.tutorial[id] = false;
  }

  playerdata.themes = {
    index: 0,
    order: ["☼", "☁︎", "☾"],
    "☼": {
      "burgeria": "red",
      "burgeria-bg": "pink",
      "newsgray": "#dcdcdc",
      "lines": "black",
      "bg": "white",
      "graph-neutral": "var(--lines)",
      "graph-negative": "var(--burgeria)",
      "graph-positive": "blue",
    },
    "☁︎": {
      "burgeria": "#E03616",
      "bg": "#FDF0D5",
      "lines": "#3A3335",
      "newsgray": "#C6CFD2",
      "graph-positive": "#5B7553"
    },
    "☾": {
      "burgeria": "black",
      "burgeria-bg": "#e3e3e3",
      "bg": "#e3e3e3",
      "newsgray": "#c7c7c7",
      "lines": "black",
    }
  };

  let abc = "abcdefghijklmnopqrstuvwxyz";
  for (let char of abc) {
    playerdata.prices[char] = [];
    playerdata.prices[char].push(Math.ceil(Math.random() * 100));
  }

  new ingredient({
    name: "top bun",
    geometry: "bun",
    color: 0xFFE4B5
  });
  new ingredient({
    name: "bottom bun",
    geometry: "bun",
    rx: 1,
    color: 0xFFE4B5
  });
  new ingredient({
    name: "patty",
    geometry: "patty",
    color: 0x8b4513
  });
  new ingredient({
    name: "ketchup",
    geometry: "condiment",
    color: 0xff0000
  });
  new ingredient({
    name: "pickle",
    geometry: "pickle",
    color: 0x3CB371
  });
  new ingredient({
    name: "onion",
    geometry: "onion",
    color: 0xffffe0,
  });
  new ingredient({
    name: "cheese",
    geometry: "cheese",
    color: 0xffd700
  });
  new ingredient({
    name: "tomato",
    geometry: "tomato",
    color: 0xff0000
  });
  new ingredient({
    name: "lettuce",
    geometry: "lettuce",
    color: 0x90ee90
  });
  new ingredient({
    name: "mayo",
    geometry: "condiment",
    color: 0xffffe0
  });

  new ingredient({
    name: "fries",
    geometry: "fries",
    color: 0xFFA500
  });
  new ingredient({
    name: "coke",
    geometry: "can",
    color: 0xff0000
  });

  playerdata.inventory = new collection();
  for (let name of ["top bun", "bottom bun", "patty", "fries", "coke"]) {
    new item(name, playerdata.inventory);
  }

  new recipe({
    name: "Burgeria Special",
    cost: 10,
    construction: {
      burger: ["bottom bun", "patty", "top bun"]
    },
    addToMenu: true
  });
  new recipe({
    name: "Onions",
    cost: 5,
    construction: {
      burger: ["onion", "onion", "onion"],
      side: ["onion"],
      drink: ["onion"]
    },
    addToMenu: true
  });
  new recipe({
    name: "Deluxe Burger",
    cost: 30,
    construction: {
      burger: ["bottom bun", "mayo", "lettuce", "tomato", "patty", "cheese", "onion", "pickle", "ketchup", "top bun"]
    },
    addToMenu: true
  });
  new recipe({
    name: "Burgeria Set",
    cost: 15,
    construction: {
      burger: ["bottom bun", "patty", "top bun"],
      drink: ["coke"],
      side: ["fries"]
    },
    addToMenu: true
  });
  new recipe({
    name: "Weird Set",
    cost: 10,
    construction: {
      drink: ["coke"],
      side: ["fries"]
    },
    addToMenu: true
  });

  // there should be a bank for the writing the player collects
  // and a separate one for the player's writing
  // but i don't want the first bank to be tied to the writingbank

  new writingpiece("moby dick", WRITINGBANK["moby dick"]);
  new writingpiece("after the dazzle of day", WRITINGBANK["after the dazzle of day"]);

  new writingpieceAlert("burgerman's welcome", WRITINGBANK["burgerman's welcome"]);
}
