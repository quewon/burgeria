function draw_guys() {
  for (let guy of playerdata.guys) {
    if (!guy.disabled) guy.draw();
  }
}

class guy {
  constructor() {
    this.id = playerdata.guys.length;

    const archs = [
      {
        name: "cat",
        source: "img/cat.png",
        chime: 0,
        pickiness: 2,
        talkInterval: 1,
      },
      {
        name: "fish",
        source: "img/fish.png",
        chime: 1,
        pickiness: 0,
        talkInterval: 1,
      },
      {
        name: "monkeey",
        source: "img/monkeey.png",
        chime: 2,
        pickiness: 1,
        talkInterval: 1,
      },
      {
        name: "mouse",
        source: "img/mouse.png",
        chime: 3,
        pickiness: 3,
        talkInterval: 1,
      }
    ];
    const arch = archs[Math.random() * archs.length | 0];

    //

    let div = divContainingTemplate("template-guy");
    let img = div.querySelector("img");
    img.src = arch.source;
    img.alt = img.title = arch.name;

    let text = div.querySelector("[name='text']");
    let number = div.querySelector("[name='number']");
    number.textContent = this.id+1;

    this.imageElement = img;
    this.textElement = text;
    this.element = div;

    scenes.storefront.day.guysContainer.appendChild(this.element);

    //

    this.talkInterval = arch.talkInterval * 10;
    this.talkTime = 0;

    this.generateDesiredMenu();
    this.createDialogue();
    this.disabled = false;

    new tray();
    _sounds.chime[arch.chime].play();

    playerdata.guys.push(this);
  }

  generateDesiredMenu() {
    this.desiredMenu = {
      recipe: playerdata.recipes[0],
      substitutes: [],
    };
  }

  addString(string, tag) {
    for (let word of string.split(" ")) {
      let el = document.createElement(tag);
      el.textContent = word;
      el.className = "gone";
      this.words.push(el);
      this.textElement.appendChild(el);
    }
  }

  createDialogue() {
    let menu = this.desiredMenu;

    this.words = [];
    this.addString("hi i would like the", "span");
    this.addString(menu.recipe.name, "em");
    this.addString("thanks :)");
  }

  draw() {
    if (this.words.length == 0) return;

    this.talkTime++;
    if (this.talkTime >= this.talkInterval) {
      this.talkTime = 0;
      let el = this.words.shift();
      el.classList.remove("gone");
      sfx("talk");
    }
  }
}
