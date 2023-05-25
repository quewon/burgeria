function deleteRecipe() {
  playerdata.recipes[game.recipeIndex].delete();
  sfx('click');
}

function createNewRecipe() {
  new Recipe({ name: 'Untitled Burger', addToMenu: true, open: true });
  updateRecipes();
}

function renameRecipe() {
  sfx('click');
  playerdata.recipes[game.recipeIndex].startRename();
}

var recipeRotation = 0;

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
  }

  addMesh(item, col) {
    switch (col.side) {
      case "burger":
        item.mesh.position.set(1.5, 0, 0);
        break;
      case "drink":
        item.mesh.position.set(-1.5, 0, 1);
        break;
      case "side":
        item.mesh.position.set(-1.5, 0, -1);
        break;
    }

    this.mesh.add(item.mesh);
    item.ground = col.groundheight;
    col.groundheight += item.height;
    item.mesh.position.y = item.ground;
  }

  resetMeshes() {
    this.mesh.rotation.y = recipeRotation;
    for (let side in this.collections) {
      const col = this.collections[side];
      for (let item of col.items) {
        item.mesh.position.y = item.ground;
        item.velocity = 0;
      }
    }
  }
}

class Recipe {
  constructor(p) {
    this.name = p.name || "";
    this.construction = p.construction || {};
    this.deviations = p.deviations || [];

    this.updateCategory();
    this.calculateSize();
    this.cost = p.cost || this.calculateIdealCost();

    this.tray = new RecipeTray(p.construction);

    if (p.addToMenu) this.addToMenu();
    if (p.open) {
      this.previewRecipe();
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

  updateCategory() {
    if (Object.keys(this.construction).length > 1) {
      this.category = "sets";
    } else {
      this.category = "singles";
    }
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

    return size;
  }

  calculateIdealCost() {
    var ingredientCost = 0;

    for (let sidename in this.construction) {
      const side = this.construction[sidename];
      for (let item of side) {
        for (let char of item) {
          if (char in playerdata.prices) {
            const prices = playerdata.prices[char];
            ingredientCost += prices[prices.length - 1];
          }
        }
      }
    }

    return Math.ceil(ingredientCost);
  }

  addToMenu() {
    this.index = playerdata.recipes.length;

    this.element = document.createElement("li");
    this.element.index = this.index;
    let button = document.createElement("button");
    button.innerHTML = this.name+" (<span class='burgerpoints' title='BurgerPoints'></span>"+this.cost+")";
    button.dataset.index = this.index;
    button.onclick = function(e) {
      const recipe = playerdata.recipes[this.dataset.index];
      recipe.previewRecipe();
    }
    this.element.appendChild(button);
    this.button = button;

    this.input = document.createElement("input");
    this.input.className = "gone";
    this.input.type = "text";
    this.input.value = this.name;
    this.input.dataset.index = this.index;
    this.input.addEventListener("blur", function(e) {
      const recipe = playerdata.recipes[this.dataset.index];
      recipe.rename();
    });
    this.input.addEventListener("keydown", function(e) {
      if (e.key == "Enter") {
        const recipe = playerdata.recipes[this.dataset.index];
        recipe.rename();
      }
    });
    this.element.appendChild(this.input);

    playerdata.recipes.push(this);

    this.tray.index = this.index;
    for (let side in this.tray.collections) {
      const el = this.tray.collections[side].element;
      el.dataset.trayId = this.tray.index;
    }
  }

  setDiscounted(discounted) {
    if (discounted) {
      this.button.innerHTML = this.name+" (<s><span class='burgerpoints' title='BurgerPoints'></span>"+this.cost+"</s> <em><span class='burgerpoints' title='BurgerPoints'></span>"+Math.ceil(this.cost/2)+"</em>)";
    } else {
      this.button.innerHTML = this.name+" (<span class='burgerpoints' title='BurgerPoints'></span>"+this.cost+")";
    }
  }

  previewRecipe() {
    if (game.recipeIndex < playerdata.recipes.length) {
      var previousRecipe = playerdata.recipes[game.recipeIndex];
      previousRecipe.closePreview();
      recipeRotation = previousRecipe.tray.mesh.rotation.y;
    }
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
    spliceIndexedObject(playerdata.recipes, this.index, function(recipe) {
      recipe.button.dataset.index = recipe.index;
      recipe.input.dataset.index = recipe.index;
    });

    this.element.remove();

    if (playerdata.recipes.length == 0) {
      const newRecipe = new Recipe({ name: 'Untitled Burger', addToMenu: true, open: true });
      updateRecipes();
    } else {
      updateRecipes();

      var domIndex = this.domIndex;
      if (domIndex >= playerdata.recipes.length) {
        domIndex--;
      }

      for (let recipe of playerdata.recipes) {
        if (recipe.domIndex == domIndex) {
          recipe.previewRecipe();
          break;
        }
      }
    }
  }

  startRename() {
    this.input.classList.remove("gone");
    this.button.classList.add("gone");
    this.input.focus();
  }

  rename(value) {
    value = value || this.input.value;
    this.name = value;
    this.button.innerHTML = value+" (<span class='burgerpoints' title='BurgerPoints'></span>"+this.cost+")";

    this.input.classList.add("gone");
    this.button.classList.remove("gone");
  }

  update() {
    this.updateConstruction();
    this.updateCategory();
    this.calculateSize();
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
