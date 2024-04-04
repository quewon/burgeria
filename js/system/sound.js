var _sounds = {
    // type: [
    //   new Howl({ src: "res/sound/click/1.wav", volume: .7 }),
    //   new Howl({ src: "res/sound/click/2.wav", volume: .7 }),
    //   new Howl({ src: "res/sound/click/3.wav", volume: .7 })
    // ],
    error: new Howl({ src: "res/sound/click/error.mp3" }),
    distill: new Howl({ src: "res/sound/dust.wav" }),
    chime: [
      new Howl({ src: "res/sound/chime/1.wav" }),
      new Howl({ src: "res/sound/chime/2.wav" }),
      new Howl({ src: "res/sound/chime/3.wav" }),
      new Howl({ src: "res/sound/chime/4.wav" })
    ],
    talk: [
      new Howl({ src: "res/sound/click/1.wav", volume: .7 }),
      new Howl({ src: "res/sound/click/2.wav", volume: .7 }),
      new Howl({ src: "res/sound/click/3.wav", volume: .7 })
    ],
    close_store: new Howl({ src: "res/sound/click/3.wav" }),
    begin_day: new Howl({ src: "res/sound/click/3.wav" }),
    burgerpoints: [
      new Howl({ src: "res/sound/point/1.wav", volume: .5 }),
      new Howl({ src: "res/sound/point/2.wav", volume: .5 }),
      new Howl({ src: "res/sound/point/3.wav", volume: .5 }),
      new Howl({ src: "res/sound/point/4.wav", volume: .5 })
    ],
    scrawl: [
      new Howl({ src: "res/sound/scrawl/1.wav" }),
      new Howl({ src: "res/sound/scrawl/2.wav" }),
    ],
    grab: new Howl({ src: "res/sound/wetgrab.wav" }),
    drop: new Howl({ src: "res/sound/wetdrop.wav" }),
};
  
function sfx(name, fadetime) {
    let sound = _sounds[name];
    if (sound.constructor === Array) sound = sound[sound.length * Math.random() | 0];
    const id = sound.play();
    if (fadetime) sound.fade(0, 1, fadetime);

    if (name == "distill") {
      sound.loop(true, id);
    }
  
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

    if (name == "distill") {
      sound.loop(false, id);
    }
}