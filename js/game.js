function update() {
  for (let i=_objectTimeouts.length-1; i>=0; i--) {
    let timeout = _objectTimeouts[i];
    timeout.time--;
    if (timeout.time <= 0) {
      timeout.object[timeout.func]();
      _objectTimeouts.splice(i, 1);
    }
  }

  for (let canvas of _canvases) {
    canvas.update();
  }
}

function animate() {
  for (let canvas of _canvases) {
    canvas.draw();
  }

  for (let guy of game.guys) {
    if (!guy.active) continue;
    if (guy.enteredStore || ui.currentScene == "facade") {
      guy.draw();
    }
  }

  requestAnimationFrame(animate);
}

window.addEventListener("beforeunload", function(e) {
  if (game.storetime > -1) {
    // automatically make everyone served
    for (let i=game.guys.length-1; i>=0; i--) {
      let guy = game.guys[i];
      guy.element.remove();
      game.guys.splice(i, 1);
    }
    game.closeStore();
  }
});

const game = {
  daytime: true, //
  storetime: -1, //
  trays: [], //
  guys: [], //
  guyIndex: 0,
  unbankedPoints: 0, //
  market: [],
  tomorrowsPrices: {},
  recipeIndex: 0,
  researchIndex: 0,

  themes: {
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
    },
  },

  config: {
    dayLength: 60 * 250, // 1 minute
    guyInterval: 12 * 250,
  },

  generateGuys() {
    for (let i=0; i<5; i++) {
      new Guy();
    }

    game.guys[Math.random() * 5 | 0].appreciatesText = true;

    // game.guys[Math.random() * 5 | 0].createRequest();
  },

  beginDay: function() {
    bankPoints(game.unbankedPoints, "BURGERIA");
    playerdata.unbankedPoints = 0;
    game.updatePrices();

    ui.storefront.menuEditButton.removeAttribute("disabled");

    playerdata.day++;
    game.daytime = true;

    newRandomWWWPiece();

    for (let i=game.guys.length-1; i>=0; i--) {
      game.guys[i].delete(true);
      game.guys.splice(i, 1);
    }

    game.generateGuys();

    new MarketAlert();
    new Headline("SMALL BURGERS...", "... ARE IN!");
    new Prices();

    sfx("begin_day");

    updateRecipes();
    updateDayUI();
    updateBankbook();
  },

  openStore: function() {
    game.guyIndex = 0;
    game.storetime = 0;
    game.updateStore();
    ui.storefront.menuEditButton.setAttribute("disabled", true);
    updateDayUI();
  },
  closeStore: function() {
    game.storetime = -1;

    let everyoneserved = true;
    for (let guy of game.guys) {
      if (guy.enteredStore && guy.active) {
        everyoneserved = false;
        break;
      }
    }

    if (everyoneserved) {
      game.beginDay();
    } else {
      sfx("close_store");
      game.daytime = false;
      updateRecipes();
      updateDayUI();

      for (let guy of game.guys) {
        guy.rejectbutton.classList.remove("gone");
      }
    }
  },
  updateStore: function() {
    if (game.storetime >= game.config.dayLength) {
      game.closeStore();
    } else {
      if (game.storetime % game.config.guyInterval == 0) {
        if (game.guyIndex < game.guys.length) {
          game.guys[game.guyIndex].enterStore();
          game.guyIndex++;
        }
      }
    }

    ui.storefront.day.timer.style.height = (game.storetime/game.config.dayLength * 100)+"%";

    if (game.storetime != -1) {
      game.storetime++;
      setObjectTimeout(this, "updateStore", 1);
    }
  },

  // day toggle action
  burgeria: function() {
    if (game.storetime != -1) {
      //game.closeStore();

      if (game.storetime < game.config.dayLength) {
        ui.dialogs["early-close"].showModal();
      } else {
        game.closeStore();
      }

    } else {
      console.clear();
      if (ui.storefront.recipePreview.classList.contains("editmode")) {
        toggleMenuEditMode();
      }

      game.openStore();
    }
  },

  updatePrices() {
    var stats = {
      mean: 0, //average
      median: 0, //middle
      mode: 0, //most
      range: 0
    };

    const abc = "abcdefghijklmnopqrstuvwxyz";
    var priceDifferences = [];
    var priceHash = {};
    var smallestPriceDifference = Infinity;
    var largestPriceDifference = 0;
    var differenceTotal = 0;

    for (let char of abc) {
      const yesterdaysPrice = playerdata.prices[char][playerdata.prices[char].length - 1];
      const todaysPrice = game.tomorrowsPrices[char];
      const difference = Math.abs(yesterdaysPrice - todaysPrice);

      if (difference == 0) continue;

      if (difference > largestPriceDifference) largestPriceDifference = difference;
      if (difference < smallestPriceDifference) smallestPriceDifference = difference;

      if (!(difference in priceHash)) {
        priceHash[difference] = 0;
      }
      priceHash[difference]++;

      differenceTotal += difference;

      priceDifferences.push(difference);
    }

    stats.range = largestPriceDifference - smallestPriceDifference;

    var modeValue = 0;
    var modeCount = 0;
    for (let diff in priceHash) {
      if (priceHash[diff] > modeCount) {
        modeValue = diff;
        modeCount = priceHash[diff];
      }
    }

    stats.mode = modeValue;

    stats.mean = differenceTotal / priceDifferences.length;

    stats.median = priceDifferences[Math.floor((priceDifferences.length - 1) / 2)];

    for (let char of abc) {
      const yesterdaysPrice = playerdata.prices[char][playerdata.prices[char].length - 1];
      var todaysPrice = game.tomorrowsPrices[char];

      if (yesterdaysPrice == todaysPrice) {
        if (Math.random() < .5) {
          todaysPrice = Math.max(.01, todaysPrice - stats.mode);
        }
      }

      playerdata.prices[char].push(todaysPrice);
    }
  },

  load: function() {

  },

  save: function() {

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

function bankPoints(value, description) {
  if (value == 0) return;

  playerdata.points += value;
  playerdata.bankbook.push([playerdata.day, description || "BURG", value < 0 ? Math.abs(value) : "", value > 0 ? value : "", playerdata.points]);

  updateBankbook();
  updatePoints();
}

function buyText(text) {
  console.log("+*: "+text);

  for (let char of text) {
    if (char in playerdata.prices) {
      game.tomorrowsPrices[char] = Math.min(1, game.tomorrowsPrices[char] + .01);
    }
  }
}

function sellText(text) {
  console.log("-*: "+text);

  for (let char of text) {
    if (char in playerdata.prices) {
      game.tomorrowsPrices[char] = Math.max(.01, game.tomorrowsPrices[char] - .01);
    }
  }
}

function calculateCost(text) {
  var cost = 0;

  for (let char of text) {
    const letter = char.toLowerCase();
    if (letter in playerdata.prices) {
      const prices = playerdata.prices[letter];
      cost += prices[prices.length - 1];
    }
  }

  return cost;
}

function spliceIndexedObject(array, objectIndex, objectFunction) {
  for (let i=objectIndex; i<array.length; i++) {
    if (i==objectIndex) continue;
    array[i].index--;
    if (objectFunction) objectFunction(array[i]);
  }

  array.splice(objectIndex, 1);
}

function toggleVolume() {
  if (playerdata.volume < 1) {
    playerdata.volume += .1;
    playerdata.volume = Math.floor(playerdata.volume * 100) / 100;
  } else {
    playerdata.volume = 0;
  }

  updateVolumeUI();
}
