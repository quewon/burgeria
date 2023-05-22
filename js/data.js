var playerdata;

function init_default_playerdata() {
  playerdata = {
    // daytime: true, //
    day: 1,
    // storetime: -1, //
    prices: {},
    recipes: [],
    // trays: [], //
    // guys: [], //

    points: 0,
    // unbankedPoints: 0, //
    bankbook: [],
    inventory: new Collection(),
    letters: {},
    ingredients: {},
    workshop: [],
    workshopIndex: 0,
    library: [],
    libraryIndex: 0,

    themeIndex: 0,
  }

  playerdata.points = 10;
  playerdata.bankbook.push([0, "BURGERMAN", "", "10", "10"]);
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

    const price = Math.random() * .1;
    playerdata.prices[char].push(price);
    game.tomorrowsPrices[char] = price;
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
}

function post_load_default_playerdata() {
  new PieceAlert(WWW[0].text, "0");
  new PieceAlert(WWW[1].text, "0");
}
