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
        order: ["☼", "☁︎"],
        "☼": {
          "burgeria": "red",
          "burgeria-bg": "pink",
          "newsgray": "#dcdcdc",
          "lines": "black",
          "bg": "white",
          "graph-neutral": "var(--lines)",
          "graph-negative": "var(--burgeria)",
          "graph-positive": "blue"
        },
        "☁︎": {
          "burgeria": "#E03616",
          "bg": "#FDF0D5",
          "lines": "#3A3335",
          "newsgray": "#C6CFD2",
          "graph-positive": "#5B7553"
        },
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
          drink: "coke",
          side: "fries"
        },
        addToMenu: true
      });
      new recipe({
        name: "Weird Set",
        cost: 10,
        construction: {
          burger: [],
          drink: "coke",
          side: "fries"
        },
        addToMenu: true
      });

      new writingpiece(`Call me Ishmael. Some years ago—never mind how long precisely—having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world. It is a way I have of driving off the spleen, and regulating the circulation. Whenever I find myself growing grim about the mouth; whenever it is a damp, drizzly November in my soul; whenever I find myself involuntarily pausing before coffin warehouses, and bringing up the rear of every funeral I meet; and especially whenever my hypos get such an upper hand of me, that it requires a strong moral principle to prevent me from deliberately stepping into the street, and methodically knocking people’s hats off—then, I account it high time to get to sea as soon as I can. This is my substitute for pistol and ball. With a philosophical flourish Cato throws himself upon his sword; I quietly take to the ship. There is nothing surprising in this. If they but knew it, almost all men in their degree, some time or other, cherish very nearly the same feelings towards the ocean with me.`);
      new writingpiece(`After the dazzle of day is gone,
Only the dark, dark night shows to my eyes the stars;
After the clangor of organ majestic, or chorus, or perfect band,
Silent, athwart my soul, moves the symphony true.`);
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

    updateDayUI();
  },

  openStore: function() {
    playerdata.storetime = 0;
    _game.updateStore();
    updateDayUI();
  },
  closeStore: function() {
    if (playerdata.storetime < _game.config.dayLength) {
      if (!confirm("Are you sure you want to end the day now?")) {
        return;
      }
      sfx("close_store");
    } else {
      // day ended naturally
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
      }
    }

    scenes.storefront.ministock.classList.add("gone");
    playerdata.storetime = -1;
    updateDayUI();
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
    console.clear();
    if (playerdata.storetime != -1) {
      _game.closeStore();
    } else {
      _game.openStore();
    }
  }
}

var playerdata = {
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
    this.construction = p.construction || {
      burger: ["bottom bun", "patty", "top bun"],
      drink: null,
      side: null,
    };
    this.deviations = p.deviations || [];
    this.category = "singles";
    if (this.construction.drink || this.construction.side) {
      this.category = "sets";
    }
    this.cost = p.cost || 10;

    if (p.addToMenu) {
      this.addToMenu();
    }
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
    for (let name of this.construction.burger) {
      new item(name, this.tray.collections.burger);
    }
    if (this.construction.drink) {
      new item(this.construction.drink, this.tray.collections.drink);
    }
    if (this.construction.side) {
      new item(this.construction.side, this.tray.collections.side);
    }

    playerdata.recipes.push(this);
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
    var deviableCategories = [];
    for (let categoryname in this.construction) {
      const category = this.construction[categoryname];
      if (!category) continue;
      if (
        typeof category == "string" ||
        (category.constructor === Array && category.length > 0)
      ) {
        deviableCategories.push(categoryname);
      }
    }

    console.log(deviableCategories);

    if (deviableCategories.length == 0) return;

    var deviationTypes = ["replace", "remove"];
    var type = deviationTypes[deviationTypes.length * Math.random() | 0];

    var randomCategory = deviableCategories[deviableCategories.length * Math.random() | 0];
    var item = this.construction[randomCategory];
    if (item.constructor === Array) item = item[item.length * Math.random() | 0];

    switch (type) {
      case "replace":
        var inglist = Object.keys(playerdata.ingredients);
        inglist.splice(inglist.indexOf(item), 1);

        var replacement = inglist[inglist.length * Math.random() | 0];
        if (!replacement) return; // in the rare case that a category contains every single ingredient

        if (typeof this.construction[randomCategory] === "string") {
          this.construction[randomCategory] = replacement;
        } else {
          this.construction[randomCategory][this.construction[randomCategory].indexOf(item)] = replacement;
        }

        this.deviations.push({
          type: type,
          category: randomCategory,
          from: item,
          to: replacement
        });

        break;

      case "remove":
        if (typeof this.construction[randomCategory] === "string") {
          this.construction[randomCategory] = null;
        } else {
          this.construction[randomCategory].splice(this.construction[randomCategory].indexOf(item), 1);
        }

        this.deviations.push({
          type: type,
          category: randomCategory,
          item: item
        });

        break;
    }
  }

  remove(itemname) {
    for (let categoryname in construction) {
      const category = construction[categoryname];
      if (!category) continue;
      if (category.constructor === Array) {
        let index = category.indexOf(itemname);
        while (index != -1) {
          category.splice(index, 1);
          index = category.indexOf(itemname);
        }
      } else if (category == a) {
        category = null;
      }
    }
  }

  replace(a, b) {
    for (let categoryname in construction) {
      const category = construction[categoryname];
      if (!category) continue;
      if (category.constructor === Array) {
        let index = category.indexOf(a);
        while (index != -1) {
          category[index] = b;
          index = category.indexOf(a);
        }
      } else if (category == a) {
        category = b;
      }
    }
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
  constructor(text) {
    this.text = text;
    this.disintegrated = false;
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

function generateNewPrices() {
  let abc = "abcdefghijklmnopqrstuvwxyz";
  for (let char of abc) {
    playerdata.prices[char].push(Math.ceil(Math.random() * 100));
  }
}
