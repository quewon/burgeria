class Tray {
  constructor() {
    this.id = game.trays.length;
    this.enabled = false;

    this.collections = {};
    this.init_tray();
    this.init_3d();

    game.trays.push(this);
  }

  init_tray() {
    this.element = divContainingTemplate("template-tray");
    this.element.classList.add("slide-down");

    let cons = this.element.querySelectorAll(".collection");
    for (let con of cons) {
      let sidename = con.getAttribute("placeholder");
      this.collections[sidename] = [];
      let col = new Collection(this, con, sidename);
      col.capacity = Number(con.dataset.capacity);
      con.dataset.containerValue = 2;
      con.dataset.trayId = this.id;
      con.dataset.side = col.side;
      con.addEventListener("mouseenter", function(e) {
        let item = _dragdrop.itemInHand;
        if (!item) return;

        this.classList.add("draghover");

        let tray = game.trays[this.dataset.trayId];
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

    let sendbutton = this.element.querySelector("[name='send']");
    sendbutton.dataset.id = this.id;
    sendbutton.onclick = function() {
      game.trays[this.dataset.id].toggleGlobalBlock("guysList", this);
    }
    this.sendbutton = sendbutton;

    let clearbutton = this.element.querySelector("[name='clear']");
    clearbutton.dataset.id = this.id;
    clearbutton.onclick = function() { game.trays[this.dataset.id].clear()}

    let stockbutton = this.element.querySelector("[name='stock']");
    stockbutton.dataset.id = this.id;
    stockbutton.onclick = function() {
      game.trays[this.dataset.id].toggleGlobalBlock("ministock", this);
    }
    this.stockbutton = stockbutton;
    this.element.dataset.id = this.id;
  }

  sendToStorefront() {
    this.enabled = true;
    ui.storefront.body.appendChild(this.element);

    const canvasContainer = this.element.querySelector("[name='canvascontainer']");
    this.canvas = new Canvas3D(canvasContainer, this.scene);
  }

  updateGlobalBlockPosition(block, button) {
    const parent = ui.storefront[block+"Tray"];

    if (parent != this) return;

    let rect = button.getBoundingClientRect();
    ui.storefront[block].style.left = (rect.left + window.scrollX)+"px";
    ui.storefront[block].style.top = (rect.bottom + window.scrollY)+"px";
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

    let el = this.element;
    el.dataset.id = this.id;
    el.classList.add("sending");

    game.guys[i].receive(this);

    el.addEventListener("animationend", function(e) {
      game.trays[this.dataset.id].canvas.delete();
      this.remove();
    });
  }

  clear() {
    for (let side in this.collections) {
      let col = this.collections[side];
      col.clear(true);
    }

    this.openGlobalBlock("ministock", this.stockbutton);
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
      const asj = a.toSorted().join("|");
      const bsj = b.toSorted().join("|");

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

    this.mesh = new THREE.Mesh(geo, material);

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
    document.body.classList.add("grabbing");

    _dragdrop.itemInHand = this;
    this.dragGhost.classList.remove("gone");
    this.dragGhost.style.left = _dragdrop.mouse.x+"px";
    this.dragGhost.style.top = _dragdrop.mouse.y+"px";
  }

  drop() {
    sfx("drop");
    document.body.classList.remove("grabbing");

    if (this.element.isConnected) {
      let parent = this.element.parentNode;
      let tray = game.trays[parent.dataset.trayId];
      let col = tray.collections[parent.dataset.side];

      this.setCollection(col);
    } else {
      if (this.previousCollection && this.previousCollection.tray) {
        const tray = this.previousCollection.tray;
        tray.updateGlobalBlockPosition("ministock", tray.stockbutton);
      }
      this.setCollection(playerdata.inventory);
    }
    _dragdrop.itemInHand = null;
    this.dragGhost.classList.add("gone");
  }
}
