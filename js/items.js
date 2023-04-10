var _renderer;
function init_3d() {
  _renderer = new THREE.WebGLRenderer({ alpha: true });
  _renderer.setPixelRatio( window.devicePixelRatio );
  _renderer.setSize(150, 150);
}

class tray {
  constructor(guy) {
    this.id = playerdata.trays.length;
    this.guy = guy;
    this.enabled = false;

    this.collections = {
      burger: null,
      drink: null,
      side: null
    };
    this.init_tray();
    this.init_3d();

    playerdata.trays.push(this);
  }

  init_tray() {
    this.element = divContainingTemplate("template-tray");
    this.element.classList.add("slide-down");

    let cons = this.element.querySelectorAll(".collection");
    for (let con of cons) {
      let col = new collection(this, con, con.getAttribute("placeholder"));
      col.capacity = Number(con.dataset.capacity);
      // col.side = con.getAttribute("placeholder");
      con.dataset.containerValue = 2;
      con.dataset.trayId = this.id;
      con.dataset.side = col.side;
      con.addEventListener("mouseenter", function(e) {
        let item = _dragdrop.itemInHand;
        if (!item) return;

        this.classList.add("draghover");

        let tray = playerdata.trays[this.dataset.trayId];
        tray.openMinistockWindow();

        let col = tray.collections[this.dataset.side];
        if (col.capacity != -1 && col.capacity < 1) return;

        this.prepend(item.element);
        item.dragGhost.classList.add("gone");
        tray.resize_3d();
        tray.updateMinistockPosition();
      });
      con.addEventListener("mouseup", function(e) {
        this.classList.remove("draghover");
      });
      con.addEventListener("mousedown", function(e) {
        // let item = col.items[col.items.length - 1];
        let item = col.removeItemByIndex(col.items.length-1);
        if (!item) return;

        item.drag();
        this.classList.add("draghover");
        this.prepend(item.element);
        item.dragGhost.classList.add("gone");
      });
      // con.onclick = function() {
      //   let tray = playerdata.trays[this.dataset.trayId];
      //   let col = tray.collections[this.dataset.side];
      //   col.removeItemByIndex(col.items.length-1);
      //   tray.resize_3d();
      //   tray.updateMinistockPosition();
      // };
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
    sendbutton.onclick = function() { playerdata.trays[this.dataset.id].send(); sfx("click"); }

    let clearbutton = this.element.querySelector("[name='clear']");
    clearbutton.dataset.id = this.id;
    clearbutton.onclick = function() { playerdata.trays[this.dataset.id].clear(); sfx("click"); }

    let stockbutton = this.element.querySelector("[name='stock']");
    stockbutton.dataset.id = this.id;
    stockbutton.onclick = function() { playerdata.trays[this.dataset.id].toggleMinistockWindow(); sfx("click"); }
    this.stockbutton = stockbutton;
    this.element.dataset.id = this.id;

    if (this.guy) {
      let number = this.element.querySelector("[name='number']");
      number.textContent = this.guy.id+1;
    }

    this.ministockOpenHere = false;
  }

  deploy() {
    this.enabled = true;
    scenes.storefront.body.appendChild(this.element);
    this.resize_3d();
  }

  updateMinistockPosition() {
    if (!this.ministockOpenHere) return;

    let rect = this.stockbutton.getBoundingClientRect();
    const ministock = scenes.storefront.ministock;
    ministock.style.left = rect.left+"px";
    ministock.style.top = (rect.bottom + window.scrollY)+"px";
  }

  toggleMinistockWindow() {
    if (!this.ministockOpenHere) {
      this.openMinistockWindow();
    } else {
      const ministock = scenes.storefront.ministock;
      ministock.classList.add("gone");
      this.ministockOpenHere = false;
    }
  }

  openMinistockWindow() {
    for (let tray of playerdata.trays) {
      tray.ministockOpenHere = false;
    }

    this.ministockOpenHere = true;
    updateMinistockWindow();
    this.updateMinistockPosition();
    const ministock = scenes.storefront.ministock;
    ministock.classList.remove("gone");
  }

  resize_3d(context) {
    context = context || this.context;

    let width = context.canvas.width;
    let height = context.canvas.height;
    let aspect = context.canvas.offsetHeight/context.canvas.offsetWidth;
    height = width * aspect;

    this.camera.left = -width/2;
    this.camera.right = width/2;
    this.camera.top = height/2;
    this.camera.bottom = -height/2;
    this.camera.updateProjectionMatrix();
  }

  init_3d() {
    let canvas = this.element.querySelector("canvas");
    let width = canvas.width;
    let height = canvas.height;
    let context = canvas.getContext("2d");

    var camera = new THREE.OrthographicCamera(0, 0, 0, 0, .1, 1000);
    camera.zoom = 35;

    var scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xffffff, .5));
    var light = new THREE.DirectionalLight(0xffe6e6, .5);
    light.position.set(10, 10, -10);
    scene.add(light);

    this.scene = scene;
    this.context = context;
    this.camera = camera;

    var traymesh = new THREE.Mesh(
      new THREE.BoxGeometry(6, .3, 4.5),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    traymesh.position.set(0, -2, 0);

    camera.position.set(0, 1, -10);
    camera.lookAt(0, 0, 0);

    scene.add(traymesh);
    this.mesh = traymesh;
  }

  resetMeshes() {
    this.mesh.rotation.y = 0;
    for (let side in this.collections) {
      const col = this.collections[side];
      for (let item of col.items) {
        item.mesh.position.y = 7+item.ground;
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
    item.mesh.position.y = 7+item.ground;
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

  draw(context) {
    context = context || this.context;

    let width = context.canvas.width;
    let height = context.canvas.height;

    context.clearRect(0, 0, width, height);

    for (let side in this.collections) {
      if (!this.collections[side]) continue;
      this.collections[side].draw();
    }

    this.mesh.rotation.y += .01;

    _renderer.render(this.scene, this.camera);
    context.drawImage(_renderer.domElement, 0, 0);
  }

  send() {
    if (this.ministockOpenHere) {
      this.toggleMinistockWindow();
    }

    let el = this.element;
    el.dataset.id = this.id;
    el.classList.add("sending");
    el.addEventListener("animationend", function(e) {
      let tray = playerdata.trays[this.dataset.id];
      tray.element.remove();
      tray.enabled = false;
    });

    this.guy.receive();
  }

  clear() {
    for (let side in this.collections) {
      let col = this.collections[side];
      col.clear(true);
    }

    this.openMinistockWindow();
  }

  satisfies(recipe) {
    console.log("checking if tray matches menu "+recipe.name+"...");

    let construction = {};

    for (let side in this.collections) {
      const collection = this.collections[side];
      if (side == "drink" || side == "side") {
        let item = collection.items[0];
        construction[side] = item ? item.name : null;
      } else {
        construction[side] = [];
        for (let item of collection.items) {
          construction[side].push(item.name);
        }
      }
    }

    for (let side in construction) {
      if (!construction[side]) {
        if (!recipe.construction[side]) {
          continue;
        } else {
          console.log("tray needs to have a "+side);
          return false;
        }
      } else {
        if (construction[side].constructor === Array) {
          if (construction[side].length != recipe.construction[side].length) {
            if (construction[side].length == 0) {
              console.log("tray needs to have a "+side);
            } else {
              console.log(side+" is missing ingredients!");
            }
            return false;
          }
          for (let i=construction[side].length-1; i>=0; i--) {
            const itemname = construction[side][i];
            if (recipe.construction[side][i] != itemname) {
              if (recipe.construction[side].includes(itemname)) {
                console.log(itemname+" is in the wrong spot!");
              } else {
                console.log(itemname+" should not be here!");
              }
              return false;
            }
          }
        } else {
          if (construction[side] != recipe.construction[side]) {
            console.log(side+" is not satisfactory.");
            return false;
          }
        }
      }
    }

    console.log("this tray is satisfactory!");

    return true;
  }
}

class collection {
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
      updateList(scenes.kitchen.inventoryList, playerdata.inventory.list);
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
      updateList(scenes.kitchen.inventoryList, playerdata.inventory.list);
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
      updateList(scenes.kitchen.inventoryList, playerdata.inventory.list);
      if (!dontUpdateMinistock) {
        updateMinistockWindow();
      }
    }
  }

  draw() {
    for (let item of this.items) { item.draw() };
  }
}

class item {
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
    const type = playerdata.ingredients[this.name].type;

    let geo = new THREE.CylinderGeometry(1, 1, .3, 12);
    this.height = .3;
    let material = new THREE.MeshStandardMaterial({ color: 0xff0000 });

    switch (type) {
      case "lettuce":
        geo = new THREE.CylinderGeometry(1.2, 1.2, .1, 12);
        this.height = .1;
        material.color.setHex(0x90ee90);
        break;
      case "tomato":
        geo = new THREE.CylinderGeometry(1, 1, .2, 12);
        this.height = .2;
        material.color.setHex(0xff0000);
        break;
      case "patty":
        material.color.setHex(0x8b4513);
        break;
      case "cheese":
        geo = new THREE.BoxGeometry(1.7, .1, 1.7);
        this.height = .1;
        material.color.setHex(0xffd700);
        break;
      case "mayo":
        geo = new THREE.CylinderGeometry(.8, .8, .1, 12);
        this.height = .1;
        material.color.setHex(0xffffe0);
        break;
      case "top bun":
        geo = new THREE.CylinderGeometry(1, 1.1, .5, 12);
        material.color.setHex(0xf5deb3);
        break;
      case "bottom bun":
        geo = new THREE.CylinderGeometry(1.1, 1, .5, 12);
        material.color.setHex(0xf5deb3);
        break;
      case "coke":
        geo = new THREE.CylinderGeometry(.5, .5, 1.2, 12);
        this.height = 1.2;
        break;
      case "fries":
        geo = new THREE.BoxGeometry(1.2, 1, .5);
        this.height = 1;
        material.color.setHex(0xFFA500);
        break;
    }

    this.mesh = new THREE.Mesh(geo, material);
    this.velocity = 0;
    this.ground = 0;
  }

  draw() {
    this.velocity += .01;
    this.mesh.position.y -= this.velocity;

    if (this.mesh.position.y - this.height/2 < this.ground) {
      this.mesh.position.y = this.ground + this.height/2;
      this.velocity = this.velocity / -2;
    }
  }

  drag() {
    document.body.classList.add("grabbing");

    _dragdrop.itemInHand = this;
    this.dragGhost.classList.remove("gone");
    this.dragGhost.style.left = _dragdrop.mouse.x+"px";
    this.dragGhost.style.top = _dragdrop.mouse.y+"px";
  }

  drop() {
    document.body.classList.remove("grabbing");

    if (this.element.isConnected) {
      let parent = this.element.parentNode;
      let tray = playerdata.trays[parent.dataset.trayId];
      let col = tray.collections[parent.dataset.side];

      this.setCollection(col);
    } else {
      this.setCollection(playerdata.inventory);
    }
    _dragdrop.itemInHand = null;
    this.dragGhost.classList.add("gone");
  }
}
