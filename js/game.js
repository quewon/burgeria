var _objectTimeouts = [];
function setObjectTimeout(object, func, time) {
  _objectTimeouts.push({
    object: object,
    func: func,
    time: time,
  });
}

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
setInterval(update, 1);

function animate() {
  for (let guy of playerdata.guys) {
    if (!guy.served) guy.draw();
  }

  for (let tray of playerdata.trays) {
    if (tray.enabled) tray.draw();
  }

  for (let recipe of playerdata.recipes) {
    if (recipe.visible) recipe.draw();
  }

  requestAnimationFrame(animate);
}

const game = {
  config: {
    dayLength: 60 * 250, // 1 minute
    guyInterval: 12 * 250,
  },

  beginDay: function() {
    bankPoints(playerdata.unbankedPoints, "BURGERIA");
    playerdata.unbankedPoints = 0;

    playerdata.day++;
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

    new Headline("SMALL BURGERS...", "... ARE IN!");
    new Prices();

    sfx("begin_day");

    updateRecipes();
    updateDayUI();
    updateBankbook();
  },

  openStore: function() {
    playerdata.storetime = 0;
    game.updateStore();
    updateDayUI();
  },
  closeStore: function() {
    if (playerdata.storetime < game.config.dayLength) {
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
      game.beginDay();
    } else {
      sfx("close_store");
      playerdata.daytime = false;
      updateRecipes();
      updateDayUI();
    }
  },
  updateStore: function() {
    if (playerdata.storetime >= game.config.dayLength) {
      game.closeStore();
    } else {
      if (playerdata.storetime % game.config.guyInterval == 0) {
        new Guy();
      }
    }

    ui.storefront.day.timer.style.height = (playerdata.storetime/game.config.dayLength * 100)+"%";

    if (playerdata.storetime != -1) {
      playerdata.storetime++;
      setObjectTimeout(this, "updateStore", 1);
    }
  },

  // day toggle action
  burgeria: function() {
    if (playerdata.storetime != -1) {
      game.closeStore();
    } else {
      console.clear();
      game.openStore();
    }
  }
}
