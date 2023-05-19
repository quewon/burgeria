function update() {
  for (let i=_objectTimeouts.length-1; i>=0; i--) {
    let timeout = _objectTimeouts[i];
    timeout.time--;
    if (timeout.time <= 0) {
      timeout.object[timeout.func]();
      _objectTimeouts.splice(i, 1);
    }
  }
}

function animate() {
  for (let guy of game.guys) {
    if (!guy.served) guy.draw();
  }

  for (let tray of game.trays) {
    if (tray.enabled) tray.draw();
  }

  for (let recipe of playerdata.recipes) {
    if (recipe.visible) recipe.draw();
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
  unbankedPoints: 0, //

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
    }
  },

  config: {
    dayLength: 60 * 250, // 1 minute
    guyInterval: 12 * 250,
  },

  beginDay: function() {
    bankPoints(game.unbankedPoints, "BURGERIA");
    playerdata.unbankedPoints = 0;

    playerdata.day++;
    game.daytime = true;

    for (let i=game.guys.length-1; i>=0; i--) {
      let guy = game.guys[i];
      guy.element.remove();
      game.guys.splice(i, 1);
    }

    for (let i=game.trays.length-1; i>=0; i--) {
      let tray = game.trays[i];
      tray.element.remove();
      game.trays.splice(i, 1);
    }

    generateNewPrices();

    new Headline("SMALL BURGERS...", "... ARE IN!");
    new Prices();

    sfx("begin_day");

    updateRecipes();
    updateDayUI();
    updateBankbook();
  },

  openStore: function() {
    game.storetime = 0;
    game.updateStore();
    updateDayUI();
  },
  closeStore: function() {
    game.storetime = -1;

    let everyoneserved = true;
    for (let guy of game.guys) {
      if (!guy.served) {
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
    }
  },
  updateStore: function() {
    if (game.storetime >= game.config.dayLength) {
      game.closeStore();
    } else {
      if (game.storetime % game.config.guyInterval == 0) {
        new Guy();
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
      game.openStore();
    }
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
