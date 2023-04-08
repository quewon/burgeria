var gamedata = {
  prices: {},
  ingredients: {},
  inventory: null,
  trays: [],
  letters: {},
  library: [],
  libraryIndex: 0,
  themes: {
    index: 1,
    order: ["default", "soft"],
    default: {
      "burgeria": "red",
      "burgeria-bg": "pink",
      "newsgray": "#dcdcdc",
      "lines": "black",
      "bg": "white",
      "graph-neutral": "var(--lines)",
      "graph-negative": "var(--burgeria)",
      "graph-positive": "blue"
    },
    soft: {
      "burgeria": "#E03616",
      "bg": "#FDF0D5",
      "lines": "#3A3335",
      "newsgray": "#C6CFD2",
      "graph-positive": "#5B7553"
    },
  },
  workshop: "",
};

function toggleTheme() {
  gamedata.themes.index++;
  if (gamedata.themes.index > gamedata.themes.order.length - 1) gamedata.themes.index = 0;
  let theme = gamedata.themes[gamedata.themes.order[gamedata.themes.index]];

  for (let key in theme) {
    let value = theme[key];
    document.documentElement.style.setProperty("--"+key, value);
  }
}

var _objectTimeouts = [];
function setObjectTimeout(object, func, time) {
  _objectTimeouts.push({
    object: object,
    func: func,
    time: time,
  });
}
function _objectTimeoutUpdate() {
  for (let i=_objectTimeouts.length-1; i>=0; i--) {
    let timeout = _objectTimeouts[i];
    timeout.time--;
    if (timeout.time <= 0) {
      timeout.object[timeout.func]();
      _objectTimeouts.splice(i, 1);
    }
  }
  requestAnimationFrame(_objectTimeoutUpdate);
}

function init_gamedata() {
  gamedata.themes.index--;
  toggleTheme();

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

  new writingpiece(`Call me Ishmael. Some years ago—never mind how long precisely—having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world. It is a way I have of driving off the spleen, and regulating the circulation. Whenever I find myself growing grim about the mouth; whenever it is a damp, drizzly November in my soul; whenever I find myself involuntarily pausing before coffin warehouses, and bringing up the rear of every funeral I meet; and especially whenever my hypos get such an upper hand of me, that it requires a strong moral principle to prevent me from deliberately stepping into the street, and methodically knocking people’s hats off—then, I account it high time to get to sea as soon as I can. This is my substitute for pistol and ball. With a philosophical flourish Cato throws himself upon his sword; I quietly take to the ship. There is nothing surprising in this. If they but knew it, almost all men in their degree, some time or other, cherish very nearly the same feelings towards the ocean with me.`);
  new writingpiece(`After the dazzle of day is gone,
Only the dark, dark night shows to my eyes the stars;
After the clangor of organ majestic, or chorus, or perfect band,
Silent, athwart my soul, moves the symphony true.`);

  updateList(scenes.kitchen.lettersList, gamedata.letters);
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
      setObjectTimeout(this, "disintegrateFrame", 1);
    } else {
      if (!this.disintegrated) {
        gamedata.library.splice(gamedata.library.indexOf(this), 1);
        navigateLibrary(0);
      }
      this.disintegrated = true;
    }
    updateLibrary();
  }
}
