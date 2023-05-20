var _canvases = [];

var renderer;
function init_3d() {
  renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize(150, 150);
}

class Canvas3D {
  constructor(parentNode, scene) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = 300;
    this.canvas.height = 300;

    parentNode.appendChild(this.canvas);

    this.context = this.canvas.getContext("2d");
    this.active = true;
    this.scene3D = null;
    if (scene) this.setScene3D(scene);

    this.id = _canvases.length;
    _canvases.push(this);
  }

  setScene3D(scene) {
    this.scene3D = scene;
    scene.sizeToCanvas(this.canvas);
  }

  activate() {
    this.active = true;
  }

  deactivate() {
    this.active = false;
  }

  draw() {
    if (!this.active || !this.scene3D) return;

    const context = this.context;
    const scene = this.scene3D;
    const width = context.canvas.width;
    const height = context.canvas.height;

    context.clearRect(0, 0, width, height);

    scene.update();

    renderer.render(scene.scene, scene.camera);
    context.drawImage(renderer.domElement, 0, 0);
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

    var camera = new THREE.OrthographicCamera(0, 0, 0, 0, .1, 1000);
    camera.zoom = 35;
    camera.position.set(0, 1, -10);
    camera.lookAt(0, 0, 0);

    this.scene = scene;
    this.camera = camera;
  }

  sizeToCanvas(canvas) {
    var width = canvas.width;
    var height = canvas.height;
    const aspect = canvas.offsetHeight / canvas.offsetWidth;
    height = width * aspect;

    this.camera.left = -width/2;
    this.camera.right = width/2;
    this.camera.top = height/2;
    this.camera.bottom = -height/2;
    this.camera.updateProjectionMatrix();
  }

  update() { }
}
