var playerdata;

function init_default_playerdata() {
  playerdata = {
    day: 1,
    prices: {},
    recipes: [],

    points: 0,
    bankbook: [],
    inventory: new Collection(),
    letters: {},
    ingredients: {},
    workshop: [],
    workshopIndex: -1,
    library: [],
    libraryIndex: -1,

    facade: [],

    requests: [],
    requestIndex: -1,

    themeIndex: 0,

    volume: .5
  }

  playerdata.points = 10;
  playerdata.bankbook.push([0, "BURGERMAN", "", "10", "10"]);
  // for (let i=0; i<100; i++) {
  //   playerdata.bankbook.push([0, "WWW", "", "100", "100"]);
  // }
  // playerdata.bankbook.push([0, "END", "", "100", "100"]);

  let abc = "abcdefghijklmnopqrstuvwxyz";
  for (let char of abc) {
    playerdata.prices[char] = [];

    const price = Math.max(.01, Math.random() * .5);
    playerdata.prices[char].push(price);
    game.tomorrowsPrices[char] = price;
  }

  for (let char of abc) {
    playerdata.letters[char] = 0;
  }

  for (let char of "aeiou") {
    playerdata.letters[char]++;
  }

  // const piece1 = new WorkshopPiece("i don't know how long i can be here for");
  // piece1.addToWorkshop();
  const piece2 = new WorkshopPiece();
  piece2.addToWorkshop();

  new Ingredient({
    name: "top bun"
  });
  new Ingredient({
    name: "bottom bun",
    rx: 1
  });
  new Ingredient({
    name: "patty"
  });
  // new Ingredient({
  //   name: "ketchup",
  //   geometry: "condiment",
  //   color: 0xff0000
  // });
  // new Ingredient({
  //   name: "pickle",
  //   geometry: "pickle",
  //   color: 0x3CB371
  // });
  new Ingredient({
    name: "onion"
  });
  // new Ingredient({
  //   name: "cheese",
  //   geometry: "cheese",
  //   color: 0xffd700
  // });
  // new Ingredient({
  //   name: "tomato",
  //   geometry: "tomato",
  //   color: 0xff0000
  // });
  // new Ingredient({
  //   name: "lettuce",
  //   geometry: "lettuce",
  //   color: 0x90ee90
  // });
  // new Ingredient({
  //   name: "mayo",
  //   geometry: "condiment",
  //   color: 0xffffe0
  // });

  new Ingredient({
    name: "fries"
  });
  new Ingredient({
    name: "coke",
    geometry: "can"
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
  // new Recipe({
  //   name: "Deluxe Burger",
  //   cost: 30,
  //   construction: {
  //     burger: ["bottom bun", "mayo", "lettuce", "tomato", "patty", "cheese", "onion", "pickle", "ketchup", "top bun"]
  //   },
  //   addToMenu: true
  // });
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

  Howler.volume(playerdata.volume);
  updateVolumeUI();
}
