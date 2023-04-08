function divContainingTemplate(templateId) {
  let div = document.createElement("div");
  let template = document.getElementById(templateId);
  let clone = template.content.cloneNode(true);
  div.appendChild(clone);
  return div;
}

function divContainingPerfectClone(element) {
  let clone = document.createElement("div");
  clone.innerHTML = element.outerHTML;

  const rect = element.getBoundingClientRect();
  clone.style.width = rect.width+"px";
  clone.style.height = rect.height+"px";
}

function draw_trays() {
  for (let tray of gamedata.trays) {
    if (!tray.disabled) tray.draw();
  }
}

class tray {
  constructor() {
    this.id = gamedata.trays.length;

    this.collections = {
      burger: null,
      drink: null,
      side: null
    };
    this.init_tray();
    this.init_3d();

    this.disabled = false;

    gamedata.trays.push(this);
  }

  init_tray() {
    this.element = divContainingTemplate("template-tray");
    this.element.classList.add("slide-up");
    scenes.storefront.body.appendChild(this.element);

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
        let tray = gamedata.trays[this.dataset.trayId];
        let col = tray.collections[this.dataset.side];
        if (col.capacity > -1 && col.capacity < 1) {
          this.classList.add("at-capacity");
          return;
        }

        this.classList.add("draghover");
        this.prepend(item.element);
        item.dragGhost.classList.add("gone");
        tray.resize_3d();
      });
      con.addEventListener("mouseup", function(e) {
        this.classList.remove("draghover");
        this.classList.remove("at-capacity");
      });
      con.onclick = function() {
        let tray = gamedata.trays[this.dataset.trayId];
        let col = tray.collections[this.dataset.side];
        col.removeItemByIndex(col.items.length-1);
        tray.resize_3d();
      };
      con.addEventListener("mouseleave", function(e) {
        this.classList.remove("draghover");
        this.classList.remove("at-capacity");
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

    let sendbutton = this.element.querySelector("footer").firstElementChild;
    sendbutton.dataset.id = this.id;
    sendbutton.onclick = function() { gamedata.trays[this.dataset.id].send(); }

    let stockbutton = this.element.querySelector("[name='stockbutton']");
    stockbutton.dataset.id = this.id;
    stockbutton.onclick = function() { gamedata.trays[this.dataset.id].toggleMinistockWindow(); }
    this.stockbutton = stockbutton;
    this.element.dataset.id = this.id;

    this.ministock = this.element.querySelector(".ministock");
    this.ministock.dataset.id = this.id;
  }

  updateMinistockWindow() {
    updateList(this.ministock, gamedata.inventory.list);
    for (let li of this.ministock.children) {
      li.classList.add("draggable");
      li.addEventListener("mousedown", function(e) {
        if (!this.name) return;

        this.classList.add("grabbing");

        let tray = gamedata.trays[this.parentNode.dataset.id];
        let item = gamedata.inventory.getItemByName(this.name);
        item.drag();
      });
    }
  }

  updateMinistockPosition() {
    let rect = this.stockbutton.getBoundingClientRect();
    this.ministock.style.left = rect.left+"px";
    this.ministock.style.top = rect.bottom+"px";
  }

  toggleMinistockWindow() {
    this.updateMinistockWindow();

    this.ministock.classList.toggle("gone");
    if (!this.ministock.classList.contains("gone")) {
      this.updateMinistockPosition();
    }
  }

  resize_3d() {
    let width = this.renderer.domElement.offsetWidth;
    let height = this.renderer.domElement.offsetHeight;
    let aspect = height / width;
    let camWidth = 300;
    let camHeight = camWidth * aspect;

    this.camera.left = -camWidth/2;
    this.camera.right = camWidth/2;
    this.camera.top = camHeight/2;
    this.camera.bottom = -camHeight/2;
    this.camera.updateProjectionMatrix();

    this.updateMinistockPosition();
  }

  init_3d() {
    let canvas = this.element.querySelector("canvas");

    var scene, camera, renderer;
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(canvas.width/-2, canvas.width/2, canvas.height/2, canvas.height/-2, .1, 1000);
    camera.zoom = 35;
    renderer = new THREE.WebGLRenderer({ alpha: true });

    canvas.parentNode.replaceChild(renderer.domElement, canvas);

    scene.add(new THREE.AmbientLight(0xffffff, .5));
    var light = new THREE.DirectionalLight(0xffe6e6, .5);
    light.position.set(10, 10, -10);
    scene.add(light);
    camera.position.set(0, 1, -10);
    camera.lookAt(0, 0, 0);

    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.resize_3d();

    //

    var traymesh = new THREE.Mesh(
      new THREE.BoxGeometry(6, .3, 4.5),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    traymesh.position.set(0, -2, 0);

    scene.add(traymesh);
    this.mesh = traymesh;
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
    col.groundheight += item.height * 1.5;
    item.mesh.position.y = 7+item.ground;
  }

  removeMesh(item, col) {
    this.mesh.remove(item.mesh);
    col.groundheight -= item.height * 1.5;
  }

  setCollection(side, col) {
    this.collections[side] = col;
    if (!col.element.isConnected) {
      this.element.querySelector(".container").appendChild(collection.element);
    }
    for (let item of col.items) {
      this.addMesh(item, col);
    }
  }

  draw() {
    for (let side in this.collections) {
      if (!this.collections[side]) continue;
      this.collections[side].draw();
    }

    this.mesh.rotation.y += .01;

    this.renderer.render(this.scene, this.camera);
  }

  send() {
    let tray = this.element;
    tray.dataset.id = this.id;
    tray.classList.add("sending");
    tray.addEventListener("animationend", function(e) {
      gamedata.trays[this.dataset.id].element.remove();
      this.disabled = true;
    });
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

    if (this.element) this.element.prepend(item.element);
    this.items.push(item);
    this.addToList(item);
    if (this == gamedata.inventory) {
      updateList(scenes.kitchen.inventoryList, gamedata.inventory.list);
      for (let tray of gamedata.trays) {
        tray.updateMinistockWindow();
      }
    }

    this.capacity--;
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
    let itemRemoved;
    for (let i=0; i<this.items.length; i++) {
      let item = this.items[i];
      if (item.name == name) {
        this.removeItemByIndex(i);
        break;
      }
    }
  }

  removeItemByIndex(index) {
    let item = this.items.splice(index, 1)[0];
    if (!item) return;

    if (this.tray) this.tray.removeMesh(item, this);
    this.removeFromList(item);
    if (this != gamedata.inventory) {
      item.setCollection(gamedata.inventory, true);
    } else {
      item.setCollection(null, true);
    }

    this.capacity++;
    if (this.element && this.element.children.length == 0) this.element.classList.add("empty");

    if (this == gamedata.inventory) {
      updateList(scenes.kitchen.inventoryList, gamedata.inventory.list);
      for (let tray of gamedata.trays) {
        tray.updateMinistockWindow();
      }
    }
  }

  draw() {
    for (let item of this.items) { item.draw() };
  }
}

class item {
  constructor(name, collection, type) {
    this.name = name;

    this.createElement();
    this.createGhost();
    this.createMesh(type || name);

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

  createMesh(type) {
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
    this.element.classList.add("grabbing");
    _dragdrop.itemInHand = this;
    this.dragGhost.classList.remove("gone");
    this.dragGhost.style.left = _dragdrop.mouse.x+"px";
    this.dragGhost.style.top = _dragdrop.mouse.y+"px";
  }

  drop() {
    this.element.classList.remove("grabbing");
    if (this.element.isConnected) {
      let parent = this.element.parentNode;
      let tray = gamedata.trays[parent.dataset.trayId];
      let col = tray.collections[parent.dataset.side];

      this.setCollection(col);
    }
    _dragdrop.itemInHand = null;
    this.dragGhost.classList.add("gone");
  }
}
