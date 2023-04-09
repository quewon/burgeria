var _sounds = {
  click: [
    new Howl({ src: "sound/click/1.wav" }),
    new Howl({ src: "sound/click/2.wav" })
  ],
  type: [
    new Howl({ src: "sound/click/1.wav" }),
    new Howl({ src: "sound/click/2.wav" }),
    new Howl({ src: "sound/click/3.wav" })
  ],
  disintegrate: new Howl({ src: "sound/disintegrate.wav", loop: true }),
};

function sfx(name, fadetime) {
  let sound = _sounds[name];
  if (sound.constructor === Array) sound = sound[sound.length * Math.random() | 0];
  sound.play();
  if (fadetime) sound.fade(0, 1, fadetime);
}

function sfx_stop(name, fadetime) {
  let sound = _sounds[name];
  if (sound.constructor === Array) sound = sound[sound.length * Math.random() | 0];
  sound.stop();
  if (fadetime) {
    sound.fade(1, 0, fadetime);
    sound.once("fade", function(e) { this.stop() });
  }
}
