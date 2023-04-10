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
  talk: [
    new Howl({ src: "sound/click/1.wav" }),
    new Howl({ src: "sound/click/2.wav" }),
    new Howl({ src: "sound/click/3.wav" })
  ],
  close_store: new Howl({ src: "sound/click/3.wav" }),
  burgerpoints: [
    new Howl({ src: "sound/point/1.wav", volume: .5 }),
    new Howl({ src: "sound/point/2.wav", volume: .5 }),
    new Howl({ src: "sound/point/3.wav", volume: .5 }),
    new Howl({ src: "sound/point/4.wav", volume: .5 })
  ],
  begin_day: new Howl({ src: "sound/click/3.wav" }),
  scrawl: [
    new Howl({ src: "sound/scrawl/1.wav" }),
    new Howl({ src: "sound/scrawl/2.wav" }),
  ],
  grab: new Howl({ src: "sound/grab.wav" }),
  drop: new Howl({ src: "sound/wetdrop.wav" }),
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
