function deleteRecipe() {
  playerdata.recipes[game.recipeIndex].delete();
  sfx('click');
}

function createNewRecipe() {
  new Recipe({ addToMenu: true, open: true });
  updateRecipes();
}

function renameRecipe() {
  sfx('click');
  playerdata.recipes[game.recipeIndex].startRename();
}

function repriceRecipe() {
  sfx("click");
  playerdata.recipes[game.recipeIndex].startReprice();
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
        ingredientCost += calculateCost(item);
      }
    }

    return Math.ceil(ingredientCost);
  }

  addToMenu() {
    this.index = playerdata.recipes.length;

    this.element = document.createElement("li");
    this.element.index = this.index;
    let button = document.createElement("button");
    button.dataset.index = this.index;
    button.onclick = function(e) {
      const recipe = playerdata.recipes[this.dataset.index];
      recipe.previewRecipe();
    }
    this.element.appendChild(button);
    this.button = button;

    this.labelElement = document.createElement("span");
    this.labelElement.innerHTML = this.name+" (<span class='burgerpoints' title='BurgerPoints'></span>"+this.cost+")";
    this.button.appendChild(this.labelElement);

    this.input = document.createElement("input");
    this.input.className = "gone";
    this.input.type = "text";
    this.input.value = this.name;
    this.input.dataset.recipeIndex = this.index;
    this.input.addEventListener("blur", function(e) {
      const recipe = playerdata.recipes[this.dataset.recipeIndex];
      recipe.rename();
    });
    this.input.addEventListener("keydown", function(e) {
      if (e.key == "Enter") {
        const recipe = playerdata.recipes[this.dataset.recipeIndex];
        recipe.rename();
      }
    });
    this.button.appendChild(this.input);

    this.inputManager = new InputManager(this.input, this.name);

    this.priceInput = document.createElement("input");
    this.priceInput.type = "number";
    this.priceInput.value = this.cost;
    this.priceInput.dataset.recipeIndex = this.index;
    this.priceInput.addEventListener("keydown", function(e) {
      if (e.key == "Enter") {
        const recipe = playerdata.recipes[this.dataset.recipeIndex];
        recipe.reprice();
      }
    });
    this.priceInput.addEventListener("blur", function(e) {
      const recipe = playerdata.recipes[this.dataset.recipeIndex];
      recipe.reprice();
    });
    this.priceInput.classList.add("gone");
    this.button.appendChild(this.priceInput);

    this.basePriceElement = document.createElement("div");
    this.basePriceElement.className = "block gone transparent monospace";
    this.basePriceElement.innerHTML = "ingredients price <span class='burgerpoints' title='BurgerPoints'></span>"+this.calculateIdealCost();
    this.element.appendChild(this.basePriceElement);

    playerdata.recipes.push(this);

    this.tray.index = this.index;
    for (let side in this.tray.collections) {
      const el = this.tray.collections[side].element;
      el.dataset.index = this.tray.index;
    }
  }

  setDiscounted(discounted) {
    if (discounted) {
      this.labelElement.innerHTML = this.name+" (<s><span class='burgerpoints' title='BurgerPoints'></span>"+this.cost+"</s> <em><span class='burgerpoints' title='BurgerPoints'></span>"+Math.ceil(this.cost/2)+"</em>)";
    } else {
      this.labelElement.innerHTML = this.name+" (<span class='burgerpoints' title='BurgerPoints'></span>"+this.cost+")";
    }
  }

  previewRecipe() {
    ui.storefront.lettersContainer.classList.add("gone");

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
      const label = preview.querySelector(".local-placeholder-"+side);
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
    this.inputManager.clear();
    this.inputManager.delete();

    spliceIndexedObject(playerdata.recipes, this.index, function(recipe) {
      recipe.button.dataset.index = recipe.index;
      recipe.input.dataset.index = recipe.index;
    });

    this.element.remove();

    if (playerdata.recipes.length == 0) {
      const newRecipe = new Recipe({ addToMenu: true, open: true });
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

    ui.storefront.lettersContainer.classList.remove("gone");
  }

  startRename() {
    this.input.classList.remove("gone");
    this.labelElement.classList.add("gone");
    this.input.focus();
    ui.storefront.lettersContainer.classList.remove("gone");
  }

  startReprice() {
    this.priceInput.classList.remove("gone");
    this.labelElement.innerHTML = this.name;
    this.priceInput.focus();
    this.basePriceElement.classList.remove("gone");
  }

  reprice(value) {
    value = value || this.priceInput.value;
    this.cost = value || 0;
    this.labelElement.innerHTML = this.name+" (<span class='burgerpoints' title='BurgerPoints'></span>"+this.cost+") ";

    this.priceInput.value = this.cost;
    this.basePriceElement.classList.add("gone");

    this.priceInput.classList.add("gone");
    this.labelElement.classList.remove("gone");
  }

  rename(value) {
    value = value || this.input.value;
    this.name = value;
    this.labelElement.innerHTML = this.name+" (<span class='burgerpoints' title='BurgerPoints'></span>"+this.cost+")";

    this.input.classList.add("gone");
    this.labelElement.classList.remove("gone");
    ui.storefront.lettersContainer.classList.add("gone");
  }

  update() {
    this.updateConstruction();
    this.updateCategory();
    this.calculateSize();
    updateRecipes();
  }
}
