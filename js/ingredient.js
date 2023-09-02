function createNewIngredient() {
  new Ingredient({ name: "" });
  game.researchIndex = Object.keys(playerdata.ingredients).length - 1;
  updateResearchBlock();
  ui.kitchen.researchLettersList.classList.remove("gone");
}

function deleteIngredient() {
  
}

class Ingredient {
  constructor(p) {
    this.name = p.name || "";

    this.makeup = this.getMakeup();
    this.size = this.getSize();

    this.createMeshRules(p.geometry, p.color, p.rx);

    let button = document.createElement("button");
    button.textContent = this.name;
    ui.kitchen.ingredientButtons.appendChild(button);
    button.dataset.ingredientName = this.name;
    button.onclick = function(e) {
      let success = playerdata.ingredients[this.dataset.ingredientName].create();
      if (success) {
        sfx("click");
      } else {
        sfx("error");
      }
    };
    this.button = button;

    playerdata.ingredients[this.name] = this;
    updateResearchBlock();
  }

  getSize() {
    var size = 0;
    for (let letter in this.makeup) {
      if (letter == 'misc') continue;
      size += this.makeup[letter];
    }
    return size;
  }

  generateStats() {
    // sums
    var sweet = 0;
    var spice = 0;
    var salt = 0;
    var value = 0;

    // value is the average of all the letters
    var letters = 0;
    for (let letter in this.makeup) {
      if (letter == 'misc') continue;
      for (let i=0; i<this.makeup[letter].count; i++) {
        const prices = playerdata.prices[letter];
        value += prices[prices.length - 1];

        sweet += LETTERS[letter].sweet;
        spice += LETTERS[letter].spice;
        salt += LETTERS[letter].salt;

        letters++;
      }
    }
    value /= letters || 1;
    sweet /= letters || 1;
    spice /= letters || 1;
    salt /= letters || 1;

    // size is compared to every other ingredient?
    var longestName = "";
    for (let ing in playerdata.ingredients) {
      if (ing.length > longestName.length) {
        longestName = ing;
      }
    }
    var size = this.name.length / longestName.length;

    return {
      sweet: sweet,
      spice: spice,
      salt: salt,
      size: size,
      value: value,
    }
  }

  getMakeup() {
    var makeup = {};
    for (let char of this.name) {
      let letter = char.toLowerCase();
      if (letter in LETTERS) {
        if (!(letter in makeup)) {
          makeup[letter] = { count: 0, percentage: 0 }
        }
        makeup[letter].count++;
      } else {
        if (!('misc' in makeup)) {
          makeup.misc = { count: 0, percentage: 0 }
        }
        makeup.misc.count++;
      }
    }

    for (let char in makeup) {
      makeup[char].percentage = makeup[char].count / this.name.length * 100;
    }

    return makeup;
  }

  createMeshRules(geoname, color, rx) {
    if (!geoname) {
      geoname = Object.keys(_geobank)[0];
      for (let geo in _geobank) {
        if (this.name.includes(geo)) {
          geoname = geo;
          break;
        }
      }
    }

    if (!color) {
      for (let name in _colorbank) {
        if (this.name.includes(name) || geoname.includes(name)) {
          color = _colorbank[name];
          break;
        }
      }
    }

    let def = new Geometry(geoname || "bun", rx || 0);
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
      ui.dialogs["no-pages"].showModal();
      return false;
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
        ui.dialogs["no-letters"].showModal();
        return false;
      }
    }
    page.text = pagetext;
    ui.kitchen.library.page.textContent = pagetext;

    this.addToInventory();

    return true;
  }

  addToInventory() {
    new Item(this.name, playerdata.inventory);

    updateList(ui.kitchen.inventoryList, playerdata.inventory.list);
  }
}
