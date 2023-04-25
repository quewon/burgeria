var playerdata = {
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
  playerdata.bankbook.push([playerdata.day, description || "BURG", value < 0 ? Math.abs(value) : "", value > 0 ? value : "", playerdata.points]);

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

  playerdata.themes = {
    index: 0,
    order: ["☼", "☁︎"], //,"☾"
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
    // "☾": {
    //   "burgeria": "black",
    //   "burgeria-bg": "#e3e3e3",
    //   "bg": "#e3e3e3",
    //   "newsgray": "#c7c7c7",
    //   "lines": "black",
    // }
  };

  let abc = "abcdefghijklmnopqrstuvwxyz";
  for (let char of abc) {
    playerdata.prices[char] = [];
    playerdata.prices[char].push(Math.ceil(Math.random() * 100));
  }

  new Ingredient({
    name: "top bun",
    geometry: "bun",
    color: 0xFFE4B5
  });
  new Ingredient({
    name: "bottom bun",
    geometry: "bun",
    rx: 1,
    color: 0xFFE4B5
  });
  new Ingredient({
    name: "patty",
    geometry: "patty",
    color: 0x8b4513
  });
  new Ingredient({
    name: "ketchup",
    geometry: "condiment",
    color: 0xff0000
  });
  new Ingredient({
    name: "pickle",
    geometry: "pickle",
    color: 0x3CB371
  });
  new Ingredient({
    name: "onion",
    geometry: "onion",
    color: 0xffffe0,
  });
  new Ingredient({
    name: "cheese",
    geometry: "cheese",
    color: 0xffd700
  });
  new Ingredient({
    name: "tomato",
    geometry: "tomato",
    color: 0xff0000
  });
  new Ingredient({
    name: "lettuce",
    geometry: "lettuce",
    color: 0x90ee90
  });
  new Ingredient({
    name: "mayo",
    geometry: "condiment",
    color: 0xffffe0
  });

  new Ingredient({
    name: "fries",
    geometry: "fries",
    color: 0xFFA500
  });
  new Ingredient({
    name: "coke",
    geometry: "can",
    color: 0xff0000
  });

  playerdata.inventory = new Collection();
  for (let name of ["top bun", "bottom bun", "patty", "fries", "coke"]) {
    new Item(name, playerdata.inventory);
  }

  new Recipe({
    name: "Burgeria Special",
    cost: 10,
    construction: {
      burger: ["bottom bun", "patty", "top bun"]
    },
    addToMenu: true
  });
  new Recipe({
    name: "Onions",
    cost: 5,
    construction: {
      burger: ["onion", "onion", "onion"],
      side: ["onion"],
      drink: ["onion"]
    },
    addToMenu: true
  });
  new Recipe({
    name: "Deluxe Burger",
    cost: 30,
    construction: {
      burger: ["bottom bun", "mayo", "lettuce", "tomato", "patty", "cheese", "onion", "pickle", "ketchup", "top bun"]
    },
    addToMenu: true
  });
  new Recipe({
    name: "Burgeria Set",
    cost: 15,
    construction: {
      burger: ["bottom bun", "patty", "top bun"],
      drink: ["coke"],
      side: ["fries"]
    },
    addToMenu: true
  });
  new Recipe({
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

  new PieceAlert(WRITINGBANK[4]);
}
