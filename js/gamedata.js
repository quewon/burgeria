var gamedata = {
  prices: {},
  ingredients: [],
  recipes: [],
  inventory: null,
  trays: [],
  letters: {},
  library: [],
  libraryIndex: 0,
  themes: {
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
  },
  workshop: "",
  points: 100,
};

function updatePoints() {
  scenes.pointsCounter.textContent = gamedata.points;
}

function updateRecipes() {
  while (scenes.storefront.recipesList.lastElementChild) {
    scenes.storefront.recipesList.lastElementChild.remove();
  }

  let singles = [];
  let sets = [];

  for (let recipe of gamedata.recipes) {
    if (recipe.drink || recipe.side) {
      sets.push(recipe);
    } else {
      singles.push(recipe);
    }
  }

  if (singles.length > 0) {
    let label = document.createElement("b");
    label.textContent = "SINGLES";

    let ul = document.createElement("ul");
    for (let recipe of singles) {
      ul.appendChild(recipe.element);
    }
    scenes.storefront.recipesList.appendChild(label);
    scenes.storefront.recipesList.appendChild(ul);
  }

  if (sets.length > 0) {
    let label = document.createElement("b");
    label.textContent = "SETS";
    if (singles.length > 0) {
      label.classList.add("margintop");
    }

    let ul = document.createElement("ul");
    for (let recipe of sets) {
      ul.appendChild(recipe.element);
    }
    scenes.storefront.recipesList.appendChild(label);
    scenes.storefront.recipesList.appendChild(ul);
  }
}

function toggleTheme(button) {
  gamedata.themes.index++;
  if (gamedata.themes.index > gamedata.themes.order.length - 1) gamedata.themes.index = 0;
  let name = gamedata.themes.order[gamedata.themes.index];
  let theme = gamedata.themes[name];

  for (let key in theme) {
    let value = theme[key];
    document.documentElement.style.setProperty("--"+key, value);
  }

  scenes.themeName.textContent = name;
}

function init_gamedata() {
  gamedata.inventory = new collection();

  let abc = "abcdefghijklmnopqrstuvwxyz";
  for (let char of abc) {
    gamedata.prices[char] = [];
    gamedata.prices[char].push(Math.ceil(Math.random() * 100));
    gamedata.prices[char].push(Math.ceil(Math.random() * 100));
  }

  for (let name of ["top bun", "bottom bun", "tomato", "cheese", "patty", "lettuce", "mayo", "fries", "coke"]) {
    new ingredient(name);
    new item(name, gamedata.inventory);
    // new item(name, gamedata.inventory);
  }

  new recipe("Burgeria Special", 10, ["bottom bun", "patty", "top bun"]);
  new recipe("Basic Set", 20, ["bottom bun", "patty", "top bun"], "coke", "fries");

  new writingpiece(`Call me Ishmael. Some years ago—never mind how long precisely—having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world. It is a way I have of driving off the spleen, and regulating the circulation. Whenever I find myself growing grim about the mouth; whenever it is a damp, drizzly November in my soul; whenever I find myself involuntarily pausing before coffin warehouses, and bringing up the rear of every funeral I meet; and especially whenever my hypos get such an upper hand of me, that it requires a strong moral principle to prevent me from deliberately stepping into the street, and methodically knocking people’s hats off—then, I account it high time to get to sea as soon as I can. This is my substitute for pistol and ball. With a philosophical flourish Cato throws himself upon his sword; I quietly take to the ship. There is nothing surprising in this. If they but knew it, almost all men in their degree, some time or other, cherish very nearly the same feelings towards the ocean with me.`);
  new writingpiece(`After the dazzle of day is gone,
Only the dark, dark night shows to my eyes the stars;
After the clangor of organ majestic, or chorus, or perfect band,
Silent, athwart my soul, moves the symphony true.`);

  updateList(scenes.kitchen.lettersList, gamedata.letters);
  updatePoints();
  updateRecipes();
}

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

    gamedata.recipes.push(this);
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
      gamedata.ingredients[this.dataset.ingredientName].create();
      sfx("click");
    };
    this.button = button;

    gamedata.ingredients[name] = this;
  }

  create() {
    let page = gamedata.library[gamedata.libraryIndex];
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
    new item(this.name, gamedata.inventory);

    updateList(scenes.kitchen.inventoryList, gamedata.inventory.list);
  }
}

class writingpiece {
  constructor(text) {
    this.text = text;
    this.disintegrated = false;
    gamedata.library.push(this);
    updateLibrary();
  }

  disintegrate() {
    this.disintegrateFrame();
    if (!this.disintegrating) {
      this.disintegrating = true;
      sfx("disintegrate", 1000);
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
        if (!(char in gamedata.letters)) {
          gamedata.letters[char] = 0;
        }
        gamedata.letters[char]++;
        updateList(scenes.kitchen.lettersList, gamedata.letters);
      }
      setObjectTimeout(this, "disintegrateFrame", 2);
    } else {
      if (!this.disintegrated) {
        gamedata.library.splice(gamedata.library.indexOf(this), 1);
        navigateLibrary(0);
        sfx_stop("disintegrate", 1000);
      }
      this.disintegrated = true;
    }
    updateLibrary();
  }
}
