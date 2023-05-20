var _geobank = {
  "bun": {
    geometry: new THREE.CylinderGeometry(1, 1.1, .4),
    height: .4
  },
  "can": {
    geometry: new THREE.CylinderGeometry(.5, .5, 1.2),
    height: 1.2
  },
  "condiment": {
    geometry: new THREE.CylinderGeometry(1, 1, .03),
    height: .03
  },
  "patty": {
    geometry: new THREE.CylinderGeometry(1, 1, .2),
    height: .2
  },
  "pickle": {
    geometry: new THREE.CylinderGeometry(.7, .7, .1),
    height: .1
  },
  "onion": {
    geometry: new THREE.TorusGeometry(.7, .2),
    height: .1,
    rx: .5
  },
  "cheese": {
    geometry: new THREE.BoxGeometry(1.7, .07, 1.7),
    height: .07
  },
  "tomato": {
    geometry: new THREE.CylinderGeometry(1, 1, .1),
    height: .1
  },
  "lettuce": {
    geometry: new THREE.CylinderGeometry(1.2, 1.2, .05),
    height: .05
  },
  "fries": {
    geometry: new THREE.BoxGeometry(1.2, 1, .5),
    height: 1
  }
};

class Geometry {
  constructor(name, rx) {
    const geo = _geobank[name];
    if (!geo) {
      console.error(name+" does not exist in geobank.");
      return;
    }
    rx = rx || 0;
    rx += 'rx' in geo ? geo.rx : 0;

    this.geometry = geo.geometry;
    this.height = geo.height;
    this.rx = rx;
  }
}

function prebuiltBurger(meshInfoArray, type) {
  const group = new THREE.Group();

  var combinedHeight = 0;
  for (let meshInfo of meshInfoArray) {
    combinedHeight += meshInfo[0].height;
  }

  var ground = combinedHeight/2;
  for (let meshInfo of meshInfoArray) {
    var mesh;
    if (type == "wireframe") {
      mesh = new THREE.LineSegments(
        new THREE.EdgesGeometry(meshInfo[0].geometry),
        new THREE.LineBasicMaterial({ color: meshInfo[1] })
      );
    } else {
      mesh = new THREE.Mesh(
        meshInfo[0].geometry,
        new THREE.MeshStandardMaterial({ color: meshInfo[1] })
      );
    }

    if (meshInfo[0].rx != 0) {
      mesh.rotation.x += Math.PI * meshInfo[0].rx;
    }

    const height = meshInfo[0].height;

    mesh.position.y = ground - height/2;
    ground -= height;

    group.add(mesh);
  }

  return group;
}
