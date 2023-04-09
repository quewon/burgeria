const _game = {
  config: {
    dayLength: 1000 * 10,
    init_playerdata: function() {
      playerdata.daytime = -1;
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

      for (let name of ["top bun", "bottom bun", "tomato", "cheese", "patty", "lettuce", "mayo", "fries", "coke"]) {
        new ingredient(name);
        new item(name, playerdata.inventory);
        // new item(name, playerdata.inventory);
      }

      new recipe("Burgeria Special", 10, ["bottom bun", "patty", "top bun"]);
      new recipe("Basic Set", 20, ["bottom bun", "patty", "top bun"], "coke", "fries");

      new writingpiece(`Call me Ishmael. Some years ago—never mind how long precisely—having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world. It is a way I have of driving off the spleen, and regulating the circulation. Whenever I find myself growing grim about the mouth; whenever it is a damp, drizzly November in my soul; whenever I find myself involuntarily pausing before coffin warehouses, and bringing up the rear of every funeral I meet; and especially whenever my hypos get such an upper hand of me, that it requires a strong moral principle to prevent me from deliberately stepping into the street, and methodically knocking people’s hats off—then, I account it high time to get to sea as soon as I can. This is my substitute for pistol and ball. With a philosophical flourish Cato throws himself upon his sword; I quietly take to the ship. There is nothing surprising in this. If they but knew it, almost all men in their degree, some time or other, cherish very nearly the same feelings towards the ocean with me.`);
      new writingpiece(`After the dazzle of day is gone,
Only the dark, dark night shows to my eyes the stars;
After the clangor of organ majestic, or chorus, or perfect band,
Silent, athwart my soul, moves the symphony true.`);
    },
  },
  init: function() {
    var _animateBG = { x:0, y:0 };
    function animate() {
      _animateBG.x += .2;
      _animateBG.y += .2;
      document.body.style.backgroundPosition = _animateBG.x+"px "+_animateBG.y+"px";

      draw_trays();
      requestAnimationFrame(animate);
    }
    animate();
    init_workshop();
    init_3d();

    //ui
    updatePoints();
    updateRecipes();
    updateList(scenes.kitchen.lettersList, playerdata.letters);
    updateDayUI();

    playerdata.themes.index--;
    toggleTheme();
  },

  updateDay: function() {
    if (playerdata.daytime == 0) {
      new headline("SMALL BURGERS...", "... ARE IN!");
      new prices();
    }
    if (playerdata.daytime % 2000 == 0) {
      new guy();
    }

    if (playerdata.daytime >= _game.config.dayLength) {
      this.endDay();
    }

    scenes.storefront.day.timer.style.height = (playerdata.daytime/_game.config.dayLength * 100)+"%";

    if (playerdata.daytime != -1) {
      playerdata.daytime++;
      setObjectTimeout(this, "updateDay", 1);
    }
  },
  beginDay: function() {
    generateNewPrices();

    playerdata.daytime = 0;
    this.updateDay();

    updateDayUI();
  },
  endDay: function() {
    if (playerdata.daytime < _game.config.dayLength) {
      if (!confirm("Are you sure you want to end the day now?")) {
        return;
      }
    }

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
    scenes.storefront.ministock.classList.add("gone");

    playerdata.daytime = -1;
    updateDayUI();
  },

  // day toggle action
  burgeria: function() {
    if (playerdata.daytime > -1) {
      this.endDay();
    } else {
      this.beginDay();
    }
  }
}

var playerdata = {
  daytime: null,
  prices: {},
  recipes: [],
  trays: [],
  guys: [],

  points: null,
  inventory: null,
  letters: {},
  ingredients: [],
  workshop: "",
  library: [],
  libraryIndex: 0,

  themes: {},
};

class recipe {
  constructor(name, cost, burger, drink, side) {
    this.name = name || "Nameless Burger";
    this.burger = burger || ["bottom bun", "patty", "top bun"];
    this.drink = drink;
    this.side = side;
    this.cost = cost || 10;

    this.element = document.createElement("li");
    this.element.innerHTML = this.name+" (<span class='burgerpoints' title='BurgerPoints'></span>"+this.cost+")";

    this.disintegrating = false;

    playerdata.recipes.push(this);
  }
}

class ingredient {
  constructor(name) {
    this.name = name;

    let button = document.createElement("button");
    button.textContent = name;
    scenes.kitchen.ingredientButtons.appendChild(button);
    button.dataset.ingredientName = name;
    button.onclick = function(e) {
      sfx("click");
      playerdata.ingredients[this.dataset.ingredientName].create();
    };
    this.button = button;

    playerdata.ingredients[name] = this;
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
