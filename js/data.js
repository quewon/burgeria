var playerdata;

function bankPoints(value, description) {
  if (value == 0) return;

  playerdata.points += value;
  playerdata.bankbook.push([playerdata.day, description || "BURG", value < 0 ? Math.abs(value) : "", value > 0 ? value : "", playerdata.points]);

  updateBankbook();
  updatePoints();
}

function init_default_playerdata() {
  playerdata = {
    daytime: true,
    day: 1,
    storetime: -1,
    prices: {},
    recipes: [],
    trays: [],
    guys: [],

    points: 0,
    unbankedPoints: 0,
    bankbook: [],
    inventory: new Collection(),
    letters: {},
    ingredients: {},
    workshop: [],
    workshopIndex: 0,
    library: [],
    libraryIndex: 0,

    toggledBooks: {},

    themes: {
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
        "burgeria": "#c43d27",
        "bg": "#f8eddb",
        "lines": "#291e2c",
        "newsgray": "#c0d0cf",
        "graph-positive": "#5B7553",
      }
    },
  }

  // playerdata.points = 100;
  // playerdata.bankbook.push([0, "BURGERMAN", "", "100", "100"]);
  // for (let i=0; i<100; i++) {
  //   playerdata.bankbook.push([0, "WWW", "", "100", "100"]);
  // }
  // playerdata.bankbook.push([0, "END", "", "100", "100"]);

  for (let char of "abcde") {
    playerdata.letters[char] = 1;
  }

  let abc = "abcdefghijklmnopqrstuvwxyz";
  for (let char of abc) {
    playerdata.prices[char] = [];
    playerdata.prices[char].push(Math.ceil(Math.random() * 100));
  }

  addPieceToWorkshop();

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

  new PieceAlert(`Dear New-owner-insert-name-here,

Hello! I see you've found your way to the kitchen. That's very promising!

In here you can check your balance, stock, and even create new ingredients out of the text in your library.

Then, if you haven't already, you can go back to the storefront and open the store to start serving customers :)

Don't worry if it seems like time is running out—Burgeria customers are a patient bunch.

Good luck stacking burgers!

Love,
Burgerman`);
  new PieceAlert(`to anyone whom this letter reaches,
i am stuck in a prison where there is little light.
i’m bored to tears. please, tell me a story.`, 5);
}
