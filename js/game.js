function _animate() {
  for (let guy of playerdata.guys) {
    if (!guy.served) guy.draw();
  }

  for (let tray of playerdata.trays) {
    if (tray.enabled) tray.draw();
  }

  for (let recipe of playerdata.recipes) {
    if (recipe.visible) recipe.draw();
  }

  requestAnimationFrame(_animate);
}

const _game = {
  config: {
    dayLength: 2000 * 10,
    init_playerdata: function() {
      playerdata.storetime = -1;
      playerdata.points = 100;

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

      playerdata.inventory = new collection();

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
    },
  },
  init: function() {
    init_workshop();
    init_3d();

    //ui
    updatePoints();
    updateRecipes();
    updateList(scenes.kitchen.lettersList, playerdata.letters);
    updateDayUI();
    playerdata.recipes[0].previewRecipe();

    playerdata.themes.index--;
    toggleTheme();

    _animate();
  },

  beginDay: function() {
    playerdata.daytime = true;

    for (let i=playerdata.guys.length-1; i>=0; i--) {
      let guy = playerdata.guys[i];
      guy.element.remove();
      playerdata.guys.splice(i, 1);
    }

    for (let i=playerdata.trays.length-1; i>=0; i--) {
      let tray = playerdata.trays[i];
      tray.element.remove();
      playerdata.trays.splice(i, 1);
    }

    generateNewPrices();

    new headline("SMALL BURGERS...", "... ARE IN!");
    new prices();

    sfx("begin_day");

    updateRecipes();
    updateDayUI();
  },

  openStore: function() {
    playerdata.storetime = 0;
    _game.updateStore();
    updateDayUI();
  },
  closeStore: function() {
    if (playerdata.storetime < _game.config.dayLength) {
      if (!confirm("Are you sure you want to end the day now?\n\n(Once your store closes, the overtime discount will be activated.)")) {
        return;
      }
    }

    playerdata.storetime = -1;

    let everyoneserved = true;
    for (let guy of playerdata.guys) {
      if (!guy.served) {
        everyoneserved = false;
        break;
      }
    }
    if (everyoneserved) {
      _game.beginDay();
    } else {
      sfx("close_store");
      playerdata.daytime = false;
      updateRecipes();
      updateDayUI();
    }
  },
  updateStore: function() {
    if (playerdata.storetime >= _game.config.dayLength) {
      _game.closeStore();
    } else {
      if (playerdata.storetime % 4000 == 0) {
        new guy();
      }
    }

    scenes.storefront.day.timer.style.height = (playerdata.storetime/_game.config.dayLength * 100)+"%";

    if (playerdata.storetime != -1) {
      playerdata.storetime++;
      setObjectTimeout(this, "updateStore", 1);
    }
  },

  // day toggle action
  burgeria: function() {
    if (playerdata.storetime != -1) {
      _game.closeStore();
    } else {
      console.clear();
      _game.openStore();
    }
  }
}

var playerdata = {
  daytime: true,
  storetime: null,
  prices: {},
  recipes: [],
  trays: [],
  guys: [],

  points: null,
  inventory: null,
  letters: {},
  ingredients: {},
  workshop: "",
  library: [],
  libraryIndex: 0,

  themes: {},
};

class recipe {
  constructor(p) {
    this.name = p.name || "Nameless Burger";
    this.construction = p.construction || {};
    this.deviations = p.deviations || [];

    if (this.construction.burger && Object.keys(this.construction).length > 1) {
      this.category = "sets";
    } else {
      this.category = "singles";
    }

    this.calculateSize();
    this.cost = p.cost || 10;

    if (p.addToMenu) {
      this.addToMenu();
    }
  }

  copy() {
    return new recipe({
      name: this.name,
      cost: this.cost,
      construction: this.copyConstruction()
    });
  }

  copyConstruction() {
    let construction = {};

    for (let sidename in this.construction) {
      const side = this.construction[sidename];
      if (side.length == 0) continue;
      construction[sidename] = [];
      for (let item of side) {
        construction[sidename].push(item);
      }
    }

    return construction;
  }

  calculateSize() {
    let size = 0;
    var ingredientsCounted = [];
    for (let sidename in this.construction) {
      const side = this.construction[sidename];
      size += side.length;
      for (let item of side) {
        if (ingredientsCounted.indexOf(item)==-1) ingredientsCounted.push(item);
      }
    }
    this.size = size;
    this.uniqueIngredients = ingredientsCounted.length;
  }

  addToMenu() {
    this.id = playerdata.recipes.length;

    this.element = document.createElement("li");
    let button = document.createElement("button");
    button.innerHTML = this.name+" (<span class='burgerpoints' title='BurgerPoints'></span>"+this.cost+")";
    button.dataset.id = this.id;
    button.onclick = function(e) {
      const recipe = playerdata.recipes[this.dataset.id];
      recipe.previewRecipe();
      sfx("click");
    }
    this.element.appendChild(button);
    this.button = button;

    this.visible = false;
    this.tray = new tray();
    for (let sidename in this.construction) {
      const side = this.construction[sidename];
      for (let itemname of side) {
        new item(itemname, this.tray.collections[sidename]);
      }
    }

    playerdata.recipes.push(this);
  }

  setDiscounted(discounted) {
    if (discounted) {
      this.button.innerHTML = this.name+" (<s><span class='burgerpoints' title='BurgerPoints'></span>"+this.cost+"</s> <em><span class='burgerpoints' title='BurgerPoints'></span>"+Math.ceil(this.cost/2)+"</em>)";
    } else {
      this.button.innerHTML = this.name+" (<span class='burgerpoints' title='BurgerPoints'></span>"+this.cost+")";
    }
  }

  previewRecipe() {
    for (let recipe of playerdata.recipes) {
      recipe.closePreview();
    }

    this.button.classList.add("selected");
    this.tray.resize_3d(scenes.storefront.recipePreviewContext);
    this.tray.resetMeshes();

    const preview = scenes.storefront.recipePreview;
    for (let side in this.tray.collections) {
      const label = preview.querySelector("[placeholder='"+side+"']");
      const el = this.tray.collections[side].element;
      label.parentNode.replaceChild(el, label);
      el.classList.add("preview");
    }

    this.visible = true;
  }

  closePreview() {
    this.visible = false;
    this.button.classList.remove("selected");
  }

  deviate() {
    var deviableSides = [];
    for (let sidename in this.construction) {
      const side = this.construction[sidename];
      if (side.length==0) continue;
      deviableSides.push(sidename);
    }
    if (deviableSides.length == 0) return;

    var deviationTypes = ["replace", "remove"];

    var type = deviationTypes[deviationTypes.length * Math.random() | 0];
    var sidename = deviableSides[deviableSides.length * Math.random() | 0];
    var side = this.construction[sidename];
    var item = side[side.length * Math.random() | 0];

    switch (type) {
      case "replace":
        var potentialIngredients = Object.keys(playerdata.ingredients);
        potentialIngredients.splice(potentialIngredients.indexOf(item), 1);

        var replacement = potentialIngredients[potentialIngredients.length * Math.random() | 0];
        if (!replacement) return; // in the rare case that a category contains every single ingredient

        side[side.indexOf(item)] = replacement;

        this.deviations.push({
          type: type,
          category: sidename,
          from: item,
          to: replacement
        });
        break;

      case "remove":
        side.splice(side.indexOf(item), 1);

        this.deviations.push({
          type: type,
          category: sidename,
          item: item
        });
        break;
    }
  }

  remove(item) {
    for (let sidename in this.construction) {
      const side = this.construction[sidename];
      let index = side.indexOf(item);
      while (index != -1) {
        side.splice(index, 1);
        index = side.indexOf(item);
      }
    }
    // size should update... but does it matter?
  }

  replace(item, replace_with) {
    for (let sidename in this.construction) {
      const side = this.construction[sidename];
      let index = side.indexOf(item);
      while (index != -1) {
        side[index] = replace_with;
        index = side.indexOf(item);
      }
    }
    // size should update... but does it matter?
  }

  draw() {
    this.tray.draw(scenes.storefront.recipePreviewContext);
  }
}

class ingredient {
  constructor(p) {
    this.name = p.name;

    this.createMeshRules(p.geometry, p.color, p.rx);

    let button = document.createElement("button");
    button.textContent = this.name;
    scenes.kitchen.ingredientButtons.appendChild(button);
    button.dataset.ingredientName = this.name;
    button.onclick = function(e) {
      sfx("click");
      playerdata.ingredients[this.dataset.ingredientName].create();
    };
    this.button = button;

    playerdata.ingredients[this.name] = this;
  }

  createMeshRules(geoname, color, rx) {
    let def = _geo(geoname, rx);
    color = color || 0xff0000;
    this.mesh = {
      geometry: def.geometry,
      height: def.height,
      color: color,
      rx: def.rx
    };
  }

  create() {
    let page = playerdata.library[playerdata.libraryIndex];
    if (!page) {
      alert("There are no pages to work with.");
      return;
    }

    let pagetext = page.text;
    let lowercase = pagetext.toLowerCase();

    // first check if this ingredient can be made
    for (let char of this.name) {
      if (char==" ") continue;

      let index = lowercase.indexOf(char);
      if (index != -1) {
        lowercase = lowercase.replace(char, "");
        pagetext = pagetext.replace(pagetext[index], "");
      } else {
        alert("There are not enough letters on the open page.");
        return;
      }
    }
    page.text = pagetext;
    scenes.kitchen.library.page.textContent = pagetext;

    this.addToInventory();
  }

  addToInventory() {
    new item(this.name, playerdata.inventory);

    updateList(scenes.kitchen.inventoryList, playerdata.inventory.list);
  }
}

class writingpiece {
  constructor(title, text) {
    this.title = title;
    this.text = text;
    this.disintegrated = false;
    playerdata.libraryIndex = playerdata.library.length;
    playerdata.library.push(this);
    updateLibrary();
  }

  disintegrate() {
    this.disintegrateFrame();
    if (!this.disintegrating) {
      this.disintegrating = true;
      this.sfxId = sfx("disintegrate");
    }
  }

  disintegrateFrame() {
    if (/[a-zA-Z]/.test(this.text)) {
      let randomindex = Math.random() * this.text.length | 0;
      while (this.text[randomindex] == " ") {
        randomindex--;
        if (randomindex < 0) randomindex = this.text.length - 1;
      }
      let char = this.text[randomindex];
      this.text = this.text.slice(0, randomindex) + " " + this.text.slice(randomindex + 1);
      if ("abcdefghijklmnopqrstuvwxyz".includes(char)) {
        if (!(char in playerdata.letters)) {
          playerdata.letters[char] = 0;
        }
        playerdata.letters[char]++;
        updateList(scenes.kitchen.lettersList, playerdata.letters);
      }
      setObjectTimeout(this, "disintegrateFrame", 2);
    } else {
      if (!this.disintegrated) {
        playerdata.library.splice(playerdata.library.indexOf(this), 1);
        navigateLibrary(0);
        sfx_stop("disintegrate", null, this.sfxId);
      }
      this.disintegrated = true;
    }
    updateLibrary();
  }
}

class writingpieceAlert {
  constructor(title, string, cost, parent) {
    let div = divContainingTemplate("template-writing-alert");
    cost = cost || 0;
    parent = parent || scenes.storefront.news;
    div.dataset.title = title;
    div.dataset.string = string;
    div.dataset.cost = cost;

    let button = div.querySelector("button");
    button.onclick = function() {
      const p = this.parentNode.parentNode;
      const c = Number(p.dataset.cost);

      if (playerdata.points < c) {
        alert("Not enough money!");
        return;
      }

      playerdata.points -= c;
      updatePoints();

      new writingpiece(p.dataset.title, p.dataset.string);
      sfx('click');

      p.classList.add("send-library");
      p.onanimationend = function() {
        this.remove();
      }
      this.onclick = null;
    }

    div.querySelector("[name='title']").textContent = title;
    if (cost == 0) {
      div.querySelector("[name='nonzerocost']").remove();
    } else {
      div.querySelector("[name='cost']").textContent = cost;
    }

    parent.appendChild(div);
  }
}

function generateNewPrices() {
  let abc = "abcdefghijklmnopqrstuvwxyz";
  for (let char of abc) {
    playerdata.prices[char].push(Math.ceil(Math.random() * 100));
  }
}
