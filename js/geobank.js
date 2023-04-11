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
    geometry: new THREE.CylinderGeometry(1, 1, .1),
    height: 0
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
    geometry: new THREE.BoxGeometry(1.7, .1, 1.7),
    height: .1
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

function _geo(name, rx) {
  const geo = _geobank[name];
  if (!geo) {
    console.error(name+" does not exist in geobank.");
    return;
  }
  rx = rx || 0;
  rx += 'rx' in geo ? geo.rx : 0;

  return {
    geometry: geo.geometry,
    height: geo.height,
    rx: rx
  }
}
