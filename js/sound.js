var _sounds = {
    click: new Howl({ src: "assets/sound/click/lowpip.mp3", volume: .7 }),
    type: [
        new Howl({ src: "assets/sound/click/1.wav", volume: .7 }),
        new Howl({ src: "assets/sound/click/2.wav", volume: .7 }),
        new Howl({ src: "assets/sound/click/3.wav", volume: .7 })
    ],
    error: new Howl({ src: "assets/sound/click/lowpip.mp3", volume: .5 }),
    disintegrate: new Howl({ src: "assets/sound/disintegrate.wav", loop: true }),
    chime: [
        new Howl({ src: "assets/sound/chime/1.wav" }),
        new Howl({ src: "assets/sound/chime/2.wav" }),
        new Howl({ src: "assets/sound/chime/3.wav" }),
        new Howl({ src: "assets/sound/chime/4.wav" })
    ],
    talk: [
        new Howl({ src: "assets/sound/click/1.wav", volume: .7 }),
        new Howl({ src: "assets/sound/click/2.wav", volume: .7 }),
        new Howl({ src: "assets/sound/click/3.wav", volume: .7 })
    ],
    close_store: new Howl({ src: "assets/sound/click/3.wav" }),
    begin_day: new Howl({ src: "assets/sound/click/3.wav" }),
    burgerpoints: [
        new Howl({ src: "assets/sound/point/1.wav", volume: .5 }),
        new Howl({ src: "assets/sound/point/2.wav", volume: .5 }),
        new Howl({ src: "assets/sound/point/3.wav", volume: .5 }),
        new Howl({ src: "assets/sound/point/4.wav", volume: .5 })
    ],
    scrawl: [
        new Howl({ src: "assets/sound/scrawl/1.wav" }),
        new Howl({ src: "assets/sound/scrawl/2.wav" }),
    ],
    grab: new Howl({ src: "assets/sound/grab.wav" }),
    drop: new Howl({ src: "assets/sound/wetdrop.wav" }),
};

function sfx(name, fadetime) {
    if (name == "click") return;

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
        sound.once("fade", function (e) { this.stop() });
    } else {
        sound.stop(id);
    }
}

export { sfx, sfx_stop }