

class Ingredient {
  constructor(p) {
    this.name = p.name;

    this.stats = this.generateStats();
    this.makeup = this.getMakeup();

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
  }

  generateStats() {
    return {
      sweet: Math.random(),
      spice: Math.random(),
      salt: Math.random(),
      size: Math.random(),
      value: Math.random(),
    }
  }

  getMakeup() {
    var makeup = {};
    for (let char of this.name) {
      if (char in playerdata.letters) {
        if (!(char in makeup)) {
          makeup[char] = { count: 0, percentage: 0 }
        }
        makeup[char].count++;
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
