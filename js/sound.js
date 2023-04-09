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
  chime: [
    new Howl({ src: "sound/chime/1.wav" }),
    new Howl({ src: "sound/chime/2.wav" }),
    new Howl({ src: "sound/chime/3.wav" }),
    new Howl({ src: "sound/chime/4.wav" })
  ],
};

function sfx(name, fadetime) {
  let sound = _sounds[name];
  if (sound.constructor === Array) sound = sound[sound.length * Math.random() | 0];
  const id = sound.play();
  if (fadetime) sound.fade(0, 1, fadetime);

  return id;
}

function sfx_stop(name, fadetime, id) {
  let sound = _sounds[name];
  if (sound.constructor === Array) sound = sound[sound.length * Math.random() | 0];
  if (fadetime) {
    sound.fade(1, 0, fadetime, id);
    sound.once("fade", function(e) { this.stop() });
  } else {
    sound.stop(id);
  }
}
