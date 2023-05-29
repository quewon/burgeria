var _sounds = {
  click: new Howl({ src: "sound/click/lowpip.mp3", volume: .7 }),
  type: [
    new Howl({ src: "sound/click/1.wav", volume: .7 }),
    new Howl({ src: "sound/click/2.wav", volume: .7 }),
    new Howl({ src: "sound/click/3.wav", volume: .7 })
  ],
  error: new Howl({ src: "sound/click/lowerpip.mp3" }),
  disintegrate: new Howl({ src: "sound/disintegrate.wav", loop: true }),
  chime: [
    new Howl({ src: "sound/chime/1.wav" }),
    new Howl({ src: "sound/chime/2.wav" }),
    new Howl({ src: "sound/chime/3.wav" }),
    new Howl({ src: "sound/chime/4.wav" })
  ],
  // talk: {
  //   "wa": [
  //     new Howl({ src: "sound/talk/wa/wa.wav" }),
  //     new Howl({ src: "sound/talk/wa/we.wav" }),
  //     new Howl({ src: "sound/talk/wa/wi.wav" }),
  //     new Howl({ src: "sound/talk/wa/wo.wav" })
  //   ],
  //   "pa": [
  //     new Howl({ src: "sound/talk/pa/pa.wav" }),
  //     new Howl({ src: "sound/talk/pa/pe.wav" }),
  //     new Howl({ src: "sound/talk/pa/pi.wav" }),
  //     new Howl({ src: "sound/talk/pa/po.wav" })
  //   ],
  //   "ka": [
  //     new Howl({ src: "sound/talk/ka/ka.wav" }),
  //     new Howl({ src: "sound/talk/ka/ke.wav" }),
  //     new Howl({ src: "sound/talk/ka/ki.wav" }),
  //     new Howl({ src: "sound/talk/ka/ko.wav" })
  //   ],
  // },
  talk: [
    new Howl({ src: "sound/click/1.wav", volume: .7 }),
    new Howl({ src: "sound/click/2.wav", volume: .7 }),
    new Howl({ src: "sound/click/3.wav", volume: .7 })
  ],
  close_store: new Howl({ src: "sound/click/3.wav" }),
  begin_day: new Howl({ src: "sound/click/3.wav" }),
  burgerpoints: [
    new Howl({ src: "sound/point/1.wav", volume: .5 }),
    new Howl({ src: "sound/point/2.wav", volume: .5 }),
    new Howl({ src: "sound/point/3.wav", volume: .5 }),
    new Howl({ src: "sound/point/4.wav", volume: .5 })
  ],
  scrawl: [
    new Howl({ src: "sound/scrawl/1.wav" }),
    new Howl({ src: "sound/scrawl/2.wav" }),
  ],
  grab: new Howl({ src: "sound/grab.wav" }),
  drop: new Howl({ src: "sound/wetdrop.wav" }),
};

function sfx_talk(name, id) {
  // let sound = _sounds.talk[name][_sounds.talk[name].length * Math.random() | 0];
  let sound = _sounds["talk"][_sounds["talk"].length * Math.random() | 0];

  if (id) sound.stop(id);
  return sound.play();
}

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
