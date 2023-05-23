class RecipeTray extends Tray {
  constructor(construction) {
    super(true);

    this.stockbutton = ui.storefront.menuStockbutton;

    if (construction) {
      for (let sidename in construction) {
        const side = construction[sidename];
        for (let itemname of side) {
          new Item(itemname, this.collections[sidename]);
        }
      }
    }

    this.element = ui.storefront.recipePreview;
  }
}

class Recipe {
  constructor(p) {
    this.name = p.name || "Untitled Burger";
    this.construction = p.construction || {};
    this.deviations = p.deviations || [];

    if (Object.keys(this.construction).length > 1) {
      this.category = "sets";
    } else {
      this.category = "singles";
    }

    this.calculateSize();
    this.cost = p.cost || 10;

    this.tray = new RecipeTray(p.construction);

    if (p.addToMenu) {
      this.addToMenu();
    }
  }

  updateConstruction() {
    this.construction = {};

    for (let sidename in this.tray.collections) {
      const col = this.tray.collections[sidename];
      if (col.items.length > 0) {
        this.construction[sidename] = [];
        for (let item of col.items) {
          this.construction[sidename].push(item.name);
        }
      }
    }
  }

  copy() {
    return new Recipe({
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
    }
    this.element.appendChild(button);
    this.button = button;

    this.index = playerdata.recipes.length;
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
    playerdata.recipes[game.recipeIndex].closePreview();
    game.recipeIndex = this.index;

    this.button.classList.add("selected");
    this.button.setAttribute("disabled", true);
    this.tray.resetMeshes();

    const preview = ui.storefront.recipePreview;
    for (let side in this.tray.collections) {
      const label = preview.querySelector("[placeholder='"+side+"']");
      const el = this.tray.collections[side].element;
      label.parentNode.replaceChild(el, label);
      el.classList.add("preview");
    }

    ui.storefront.recipePreviewCanvas.setScene3D(this.tray.scene);

    if (!ui.storefront.ministock.classList.contains("gone") && ui.storefront.recipePreview.classList.contains("editmode")) {
      ui.storefront.ministockTray = this.tray;
      this.tray.updateGlobalBlockPosition("ministock", this.tray.stockbutton);
    }
  }

  closePreview() {
    this.button.classList.remove("selected");
    this.button.removeAttribute("disabled");

    if (Object.keys(this.construction).length == 0) {
      this.delete();
    }
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

  removeItem(item) {
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

  replaceItem(item, replace_with) {
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

  delete() {
    for (let i=this.index; i<playerdata.recipes.length; i++) {
      if (this.index == i) continue;
      const recipe = playerdata.recipes[i];

      recipe.index--;
      recipe.button.dataset.id = recipe.index;
    }
    playerdata.recipes.splice(this.index, 1);

    this.element.remove();

    updateRecipes();
  }
}

class Ingredient {
  constructor(p) {
    this.name = p.name;

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

  createMeshRules(geoname, color, rx) {
    let def = new Geometry(geoname, rx);
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
