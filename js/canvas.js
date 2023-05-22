var _canvases = [];

var renderer;
function init_3d() {
  renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setSize(300, 300);
}

class Canvas3D {
  constructor(parentNode, scene) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = 300;
    this.canvas.height = 300;

    parentNode.appendChild(this.canvas);

    this.context = this.canvas.getContext("2d");
    this.setScene3D(scene);
    this.activate();

    this.id = _canvases.length;
    _canvases.push(this);
  }

  setScene3D(scene) {
    this.scene3D = scene;
  }

  activate() {
    this.active = true;
    if (this.scene3D) this.scene3D.onactivate();
  }

  deactivate() {
    this.active = false;
  }

  draw() {
    if (!this.active || !this.scene3D) return;

    const context = this.context;
    const scene = this.scene3D;
    const width = this.canvas.width;
    const height = this.canvas.height;

    context.clearRect(0, 0, width, height);

    renderer.render(scene.scene, scene.camera);
    context.drawImage(renderer.domElement, 0, 0);
  }

  update() {
    const scene = this.scene3D;
    scene.update();
  }

  delete() {
    for (let i=this.id; i<_canvases.length; i++) {
      if (i == this.id) continue;
      _canvases[i].id--;
    }
    _canvases.splice(this.id, 1);
  }
}

class Scene3D {
  constructor() {
    var scene = new THREE.Scene();

    scene.add(new THREE.AmbientLight(0xffffff, .5));
    var light = new THREE.DirectionalLight(0xffe6e6, .5);
    light.position.set(10, 10, -10);
    scene.add(light);

    var camera = new THREE.OrthographicCamera(-150, 150, 150, -150, .1, 1000);
    camera.zoom = 35;
    camera.updateProjectionMatrix();
    camera.position.set(0, 1, -10);
    camera.lookAt(0, 0, 0);

    this.scene = scene;
    this.camera = camera;
  }

  onactivate() { }

  update() { }
}
