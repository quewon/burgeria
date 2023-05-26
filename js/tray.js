class Tray {
  constructor(isRecipeTray) {
    this.index = game.trays.length;
    this.enabled = false;

    this.collections = {};
    this.init_3d();
    this.init_tray();

    if (!isRecipeTray) {
      game.trays.push(this);
    }
  }

  init_tray() {
    this.element = divContainingTemplate("tray");
    this.element.classList.add("slide-down");

    let cons = this.element.querySelectorAll(".collection");
    for (let con of cons) {
      let sidename = con.getAttribute("placeholder");
      this.collections[sidename] = [];
      let col = new Collection(this, con, sidename);
      col.capacity = Number(con.dataset.capacity);
      con.dataset.containerValue = 2;
      con.dataset.index = this.index;
      con.dataset.side = col.side;
      con.addEventListener("mouseenter", function(e) {
        let item = _dragdrop.itemInHand;
        if (!item) return;

        this.classList.add("draghover");

        let tray;
        if (!this.classList.contains("preview")) {
          tray = game.trays[this.dataset.index];
        } else {
          tray = playerdata.recipes[this.dataset.index].tray;
        }

        tray.openGlobalBlock("ministock", tray.stockbutton);

        let col = tray.collections[this.dataset.side];
        if (col.capacity != -1 && col.capacity < 1) return;

        this.prepend(item.element);
        item.dragGhost.classList.add("gone");
        tray.updateGlobalBlockPosition("ministock", tray.stockbutton);
      });
      con.addEventListener("mouseup", function(e) {
        this.classList.remove("draghover");
      });
      con.addEventListener("mousedown", function(e) {
        if (_dragdrop.itemInHand) return;

        let item = col.removeItemByIndex(col.items.length-1);
        if (!item) return;

        if (this.classList.contains("preview")) {
          const recipe = playerdata.recipes[this.dataset.index];
          recipe.update();
        }

        item.drag();
        this.classList.add("draghover");
        this.prepend(item.element);
        item.dragGhost.classList.add("gone");
      });
      con.addEventListener("mouseleave", function(e) {
        this.classList.remove("draghover");

        let item = _dragdrop.itemInHand;
        if (item) {
          item.element.remove();
          item.dragGhost.classList.remove("gone");
          if (this.children.length == 0) {
            this.classList.add("empty");
          }
        }
      });
    };

    let closebutton = this.element.querySelector("[name='close']");
    closebutton.dataset.index = this.index;
    closebutton.onclick = function() {
      const tray = game.trays[this.dataset.index];
      tray.clear(true);
      tray.prepareDeletion();
      return;
    }
    this.closebutton = closebutton;

    let sendbutton = this.element.querySelector("[name='send']");
    sendbutton.dataset.index = this.index;
    sendbutton.onclick = function() {
      const tray = game.trays[this.dataset.index];

      tray.toggleGlobalBlock("guysList", this);
    }
    this.sendbutton = sendbutton;

    let clearbutton = this.element.querySelector("[name='clear']");
    clearbutton.dataset.index = this.index;
    clearbutton.onclick = function() { game.trays[this.dataset.index].clear()}
    this.clearbutton = clearbutton;

    let stockbutton = this.element.querySelector("[name='stock']");
    stockbutton.dataset.index = this.index;
    stockbutton.onclick = function() {
      game.trays[this.dataset.index].toggleGlobalBlock("ministock", this);
    }
    this.stockbutton = stockbutton;
    this.element.dataset.index = this.index;
  }

  sendToStorefront() {
    this.enabled = true;
    ui.storefront.body.appendChild(this.element);

    const canvasContainer = this.element.querySelector("[name='canvascontainer']");
    this.canvas = new Canvas3D(canvasContainer, this.scene);
  }

  updateGlobalBlockPosition(block, button) {
    if (ui.currentScene != "storefront") {
      var currentScene = ui.scenes[ui.currentScene];
      currentScene.classList.add("hidden");
      ui.scenes.storefront.classList.remove("hidden");
    }

    const parent = ui.storefront[block+"Tray"];

    if (parent != this) return;

    let rect = button.getBoundingClientRect();
    ui.storefront[block].style.left = (rect.left + window.scrollX)+"px";
    ui.storefront[block].style.top = (rect.bottom + window.scrollY)+"px";

    if (ui.currentScene != "storefront") {
      var currentScene = ui.scenes[ui.currentScene];
      currentScene.classList.remove("hidden");
      ui.scenes.storefront.classList.add("hidden");
    }
  }

  toggleGlobalBlock(block, button) {
    const parent = ui.storefront[block+"Tray"];

    if (parent != this) {
      this.openGlobalBlock(block, button);
    } else {
      ui.storefront[block].classList.add("gone");
      ui.storefront[block+"Tray"] = null;
    }
  }

  openGlobalBlock(block, button) {
    ui.storefront[block+"Tray"] = this;

    if (block == "ministock") {
      updateMinistockWindow();
    } else {
      updateGuysList();
    }

    this.updateGlobalBlockPosition(block, button);
    ui.storefront[block].classList.remove("gone");
  }

  init_3d() {
    this.scene = new Scene3D();

    var traymesh = new THREE.Mesh(
      new THREE.BoxGeometry(6, .3, 4.5),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    traymesh.position.set(0, -2, 0);
    this.mesh = traymesh;

    this.scene.scene.add(this.mesh);

    this.scene.tray = this;
    this.scene.update = function() {
      this.tray.update();
    };
  }

  resetMeshes() {
    this.mesh.rotation.y = 0;
    for (let side in this.collections) {
      const col = this.collections[side];
      for (let item of col.items) {
        item.mesh.position.y = 7 + item.ground;
        item.velocity = 0;
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
    item.mesh.position.y = 7 + item.ground;
  }

  removeMesh(item, col) {
    this.mesh.remove(item.mesh);
    col.groundheight -= item.height;
  }

  setCollection(side, col) {
    this.collections[side] = col;
    for (let item of col.items) {
      this.addMesh(item, col);
    }
  }

  update() {
    this.mesh.rotation.y += .003;
    for (let side in this.collections) { this.collections[side].update() };
  }

  send(i) {
    if (!this.enabled) return;
    this.enabled = false;

    for (let side in this.collections) {
      for (let item of this.collections[side].items) {
        sellText(item.name);
      }
    }

    if (ui.storefront.ministockTray == this) {
      this.toggleGlobalBlock("ministock", this.stockbutton);
    }
    if (ui.storefront.guysListTray == this) {
      this.toggleGlobalBlock("guysList", this.sendbutton);
    }

    game.guys[i].receive(this);
    this.prepareDeletion();
  }

  prepareDeletion() {
    this.element.classList.add("sending");
    this.element.addEventListener("animationend", function(e) {
      const tray = game.trays[this.dataset.index];
      tray.delete();
    });
  }

  delete() {
    spliceIndexedObject(game.trays, this.index, function(tray) {
      tray.element.dataset.index = tray.index;
      tray.stockbutton.dataset.index = tray.index;
      tray.sendbutton.dataset.index = tray.index;
      tray.clearbutton.dataset.index = tray.index;
      tray.closebutton.dataset.index = tray.index;
      for (let sidename in tray.collections) {
        tray.collections[sidename].element.dataset.index = tray.index;
      }
    });

    if (this.element) this.element.remove();
    if (this.canvas) this.canvas.delete();
  }

  clear(dontOpenStock) {
    for (let side in this.collections) {
      let col = this.collections[side];
      col.clear(true);
    }

    if (!dontOpenStock) this.openGlobalBlock("ministock", stockbutton || this.stockbutton);
  }

  getConstruction() {
    let construction = {};
    for (let sidename in this.collections) {
      const collection = this.collections[sidename];
      const side = collection.items;
      if (side.length > 0) {
        construction[sidename] = [];
        for (let item of side) {
          construction[sidename].push(item.name);
        }
      }
    }
    return construction;
  }

  requestFeedback(recipe) {
    let feedback = {
      tray_has_nothing: true,
      tray_is_perfect: true,
      categories_in_wrong_order: [],
      categories_missing: [],
      categories_mixed_up: [
        // {
        //   category: "",
        //   should_be: "",
        // }
      ],
      categories_swapped: [],
      items_missing: [
        // {
        //   category: "",
        //   item: ""
        // }
      ],
      items_misplaced: [],
      unwanted_categories: [],
      unwanted_items: [],
      categories_overfilled: [],
    };

    let construction = this.getConstruction();

    var all_items_in_recipe = [];
    for (let sidename in recipe.construction) {
      const side = recipe.construction[sidename];
      for (let item of side) {
        all_items_in_recipe.push(item);
      }
    }

    var all_items_in_tray = [];

    for (let sidename in construction) {
      const a = construction[sidename];
      var b;
      if (!(sidename in recipe.construction)) {
        b = [];
      } else {
        b = recipe.construction[sidename];
      }
      const aj = a.join("|");
      const bj = b.join("|");
      const asj = a.sort().join("|");
      const bsj = b.sort().join("|");

      if (aj != bj && a.length == b.length && asj == bsj) {
        feedback.tray_is_perfect = false;
        feedback.categories_in_wrong_order.push(sidename);
      } else {
        if (a.length > 0 && b.length == 0) {
          feedback.tray_is_perfect = false;
          feedback.unwanted_categories.push(sidename);
        } else if (a.length > b.length) {
          feedback.tray_is_perfect = false;
          feedback.categories_overfilled.push(sidename);
        }

        for (let bsidename in recipe.construction) {
          const bside = recipe.construction[bsidename];
          if (bside.length == 0 || sidename == bsidename || bside.join("|") == bj) continue;
          if (bside.join("|") == aj) {
            feedback.tray_is_perfect = false;
            feedback.categories_mixed_up.push({
              category: sidename,
              should_be: bsidename
            });
          }
        }
      }

      for (let i=a.length-1; i>=0; i--) {
        const item = a[i];
        all_items_in_tray.push(item);
        if (item != b[i]) {
          if (all_items_in_recipe.includes(item)) {
            feedback.tray_is_perfect = false;
            feedback.items_misplaced.push({
              category: sidename,
              item: item
            });
          } else {
            feedback.tray_is_perfect = false;
            feedback.unwanted_items.push({
              category: sidename,
              item: item
            });
          }
        }

        all_items_in_recipe.splice(all_items_in_recipe.indexOf(item), 1);
      }
    }

    if (all_items_in_tray.length > 0) {
      feedback.tray_has_nothing = false;
    }

    for (let sidename in recipe.construction) {
      const side = recipe.construction[sidename];
      var a;
      if (!(sidename in construction)) {
        a = [];
      } else {
        a = construction[sidename];
      }

      if (side.length != 0 && a.length == 0) {
        feedback.tray_is_perfect = false;
        feedback.categories_missing.push(sidename);
        continue;
      }
      for (let i=side.length-1; i>=0; i--) {
        const item = side[i];
        if (item != a[i]) {
          if (!all_items_in_tray.includes(item)) {
            feedback.tray_is_perfect = false;
            feedback.items_missing.push({
              category: sidename,
              item: item
            })
          }
        }
        all_items_in_tray.splice(all_items_in_tray.indexOf(item), 1);
      }
    }

    for (let a of feedback.categories_mixed_up) {
      for (let b of feedback.categories_mixed_up) {
        if (a.should_be == b.category && a.category == b.should_be) {
          feedback.categories_swapped.push({
            a: a.category,
            b: b.category
          });
        }
      }
    }

    return feedback;
  }
}

class Collection {
  constructor(tray, element, side) {
    this.element = element;
    this.side = side;
    this.capacity = element ? Number(element.dataset.capacity) : -1;
    this.groundheight = .3;
    this.items = [];
    this.list = {};
    this.tray = tray;
    if (tray) {
      tray.setCollection(this.side, this);
    }
  }

  addItem(item) {
    if (this.element) this.element.classList.remove("empty");

    if (this.tray) {
      this.tray.addMesh(item, this);
    }

    if (this.element) {
      this.element.prepend(item.element);
      this.element.classList.add("draggable");
    }
    this.items.push(item);
    this.addToList(item);
    if (this == playerdata.inventory) {
      updateList(ui.kitchen.inventoryList, playerdata.inventory.list);
      updateMinistockWindow();
    }

    if (this.capacity != -1) {
      this.capacity--;
      if (this.capacity <= 0) {
        this.element.classList.add("at-capacity");
      }
    }
  }

  addToList(item) {
    if (!(item.name in this.list)) this.list[item.name] = 0;
    this.list[item.name]++;
  }

  removeFromList(item) {
    this.list[item.name]--;
    if (this.list[item.name] == 0) delete this.list[item.name];
  }

  getItemByName(name) {
    let itemFound;
    for (let i=0; i<this.items.length; i++) {
      let item = this.items[i];
      if (item.name == name) {
        itemFound = item;
        break;
      }
    }
    return itemFound;
  }

  removeItemByName(name) {
    for (let i=0; i<this.items.length; i++) {
      let item = this.items[i];
      if (item.name == name) {
        return this.removeItemByIndex(i);
        break;
      }
    }
  }

  removeItemByIndex(index) {
    let item = this.items.splice(index, 1)[0];
    if (!item) return;

    if (this.tray) this.tray.removeMesh(item, this);
    this.removeFromList(item);
    item.setCollection(null, true);

    if (this.capacity != -1) {
      this.capacity++;
      this.element.classList.remove("at-capacity");
    }
    if (this.element) {
      this.element.classList.remove("draggable");
      if (this.element.children.length == 0) {
        this.element.classList.add("empty");
      }
    }

    if (this == playerdata.inventory) {
      updateList(ui.kitchen.inventoryList, playerdata.inventory.list);
      updateMinistockWindow();
    }

    return item;
  }

  clear(dontUpdateMinistock) {
    for (let i=this.items.length-1; i>=0; i--) {
      let item = this.items[i];
      if (this.tray) this.tray.removeMesh(item, this);
      this.removeFromList(item);
      if (this != playerdata.inventory) {
        item.setCollection(playerdata.inventory, true);
      } else {
        item.setCollection(null, true);
      }
      if (this.capacity != -1) {
        this.capacity++;
        this.element.classList.remove("at-capacity");
      }
      this.element.classList.remove("draggable");
      this.items.splice(i, 1);
    }
    this.element.classList.add("empty");
    if (this == playerdata.inventory) {
      updateList(ui.kitchen.inventoryList, playerdata.inventory.list);
      if (!dontUpdateMinistock) {
        updateMinistockWindow();
      }
    }
  }

  update() {
    for (let item of this.items) { item.update() };
  }
}

class Item {
  constructor(name, collection) {
    this.name = name;

    this.createElement();
    this.createGhost();
    this.createMesh(name);

    this.setCollection(collection);
  }

  createElement() {
    let span = document.createElement("span");
    span.textContent = this.name;
    span.className = "item";
    this.element = span;
    this.element.onmousedown = function(e) {

    }
  }

  setCollection(collection, fromCollection) {
    this.previousCollection = this.collection;

    this.element.remove();
    if (this.collection && !fromCollection) {
      this.collection.removeItemByName(this.name);
    }
    if (collection) collection.addItem(this);
    this.collection = collection;
  }

  createGhost() {
    let ghost = document.createElement("span");
    ghost.textContent = this.name;
    ghost.className = "dragghost gone";
    document.body.appendChild(ghost);
    this.dragGhost = ghost;
  }

  createMesh() {
    const ing = playerdata.ingredients[this.name];

    const geo = ing.mesh.geometry;
    const material = new THREE.MeshStandardMaterial({ color: ing.mesh.color });
    material.shading = THREE.SmoothShading;
    geo.computeVertexNormals(true);

    this.mesh = new THREE.Group();

    this.solidMesh = new THREE.Mesh(geo, material);
    // this.wireframeMesh = new THREE.LineSegments(
    //   new THREE.EdgesGeometry(geo),
    //   new THREE.LineBasicMaterial({ color: 0xff0000 })
    // );

    this.mesh.add(this.solidMesh);

    if (ing.mesh.rx != 0) {
      this.mesh.rotation.x += Math.PI * ing.mesh.rx;
    }

    this.height = ing.mesh.height;
    this.velocity = 0;
    this.ground = 0;
  }

  update() {
    this.velocity += .0009;
    this.mesh.position.y -= this.velocity;

    if (this.mesh.position.y - this.height/2 < this.ground) {
      this.mesh.position.y = this.ground + this.height/2;
      this.velocity /= -2;
    }
  }

  drag() {
    sfx("grab");
    document.documentElement.classList.add("grabbing");

    _dragdrop.itemInHand = this;
    this.dragGhost.classList.remove("gone");
    this.dragGhost.style.left = _dragdrop.mouse.x+"px";
    this.dragGhost.style.top = _dragdrop.mouse.y+"px";
  }

  drop() {
    sfx("drop");
    document.documentElement.classList.remove("grabbing");

    if (this.element.isConnected) {
      let parent = this.element.parentNode;

      let tray;
      let recipe;
      if (!parent.classList.contains("preview")) {
        tray = game.trays[parent.dataset.index];
      } else {
        recipe = playerdata.recipes[parent.dataset.index];
        tray = recipe.tray;
      }

      let col = tray.collections[parent.dataset.side];

      this.setCollection(col);

      if (recipe) {
        recipe.update();
      }
    } else {
      if (this.previousCollection && this.previousCollection.tray) {
        const tray = this.previousCollection.tray;
        if (ui.storefront.ministock.classList.contains("gone")) {
          tray.toggleGlobalBlock("ministock", tray.stockbutton);
        }
        tray.updateGlobalBlockPosition("ministock", tray.stockbutton);
      }
      this.setCollection(playerdata.inventory);
    }
    _dragdrop.itemInHand = null;
    this.dragGhost.classList.add("gone");
  }
}

var _dragdrop = {
  itemInHand: null,
  facadePieceInHand: null,
  mouse: { x:0, y:0, xp: 0, yp: 0 }
};

function init_dragdrop() {
  window.addEventListener("mousemove", function(e) {
    let x = e.pageX;
    let y = e.pageY;
    _dragdrop.mouse.x = x;
    _dragdrop.mouse.y = y;
    _dragdrop.mouse.xp = x/document.documentElement.clientWidth * 100;
    _dragdrop.mouse.yp = y/document.documentElement.clientHeight * 100;

    let item = _dragdrop.itemInHand;
    if (item) {
      let ghost = item.dragGhost;
      ghost.style.left = x+"px";
      ghost.style.top = y+"px";
    }

    let piece = _dragdrop.facadePieceInHand;
    if (piece) {
      piece.moveToMouse();
    }
  });

  function mouseup() {
    let grabbing = document.querySelector(".grabbing");
    if (grabbing) grabbing.classList.remove("grabbing");

    let item = _dragdrop.itemInHand;
    if (item) {
      item.drop();
    }

    let piece = _dragdrop.facadePieceInHand;
    if (piece) {
      piece.drop();
    }
  }
  window.addEventListener("mouseup", mouseup);
  window.addEventListener("blur", mouseup);
}
