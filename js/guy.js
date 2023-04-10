class guy {
  constructor() {
    this.id = playerdata.guys.length;

    const archs = [
      {
        name: "cat",
        source: "img/cat.png",
        chime: 0,
        pickiness: 2,
        talkInterval: 2,
      },
      {
        name: "fish",
        source: "img/fish.png",
        chime: 1,
        pickiness: 0,
        talkInterval: .7,
      },
      {
        name: "monkeey",
        source: "img/monkey.png",
        chime: 2,
        pickiness: 1,
        talkInterval: 1,
      },
      {
        name: "mouse",
        source: "img/mouse.png",
        chime: 3,
        pickiness: 3,
        talkInterval: .5,
      },
      {
        name: "dog",
        source: "img/dog.png",
        chime: 0,
        pickiness: 1,
        talkInterval: 1.5
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

    this.generateDesiredMenu();
    this.createDialogue();
    this.disabled = false;

    this.talkInterval = arch.talkInterval * 3;
    this.talkTime = 0;
    this.currentTalkInterval = 5 * this.talkInterval;

    this.tray = new tray(this);
    this.tray.deploy();
    _sounds.chime[arch.chime].play();

    playerdata.guys.push(this);
  }

  generateDesiredMenu() {
    this.desiredMenu = {
      recipe: playerdata.recipes[0],
      substitutes: [],
    };
  }

  createDialogue() {
    let menu = this.desiredMenu;

    this.words = [];
    this.addString("hi i would like the", "span");
    this.addString(menu.recipe.name, "em");
    this.addString("thanks :)");
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

  updateTalk() {
    let el = this.words.shift();
    el.classList.remove("gone");
    this.currentTalkInterval = el.textContent.length * this.talkInterval;
    sfx("talk");
  }

  draw() {
    if (this.words.length == 0) return;

    this.talkTime++;
    if (this.talkTime >= this.currentTalkInterval) {
      this.talkTime = 0;
      this.updateTalk();
    }
  }

  receive() {
    let tray = this.tray;

    this.element.dataset.id = this.id;
    this.element.classList.add("removing-ticket");
    this.element.addEventListener("animationend", function(e) {
      let guy = playerdata.guys[this.dataset.id];
      guy.element.remove();
      guy.disabled = true;
    });

    for (let i=0; i<this.desiredMenu.recipe.cost; i++) {
      setTimeout(burgerpointParticle, Math.random() * 100 * this.desiredMenu.recipe.cost);
    }
  }
}

function burgerpointParticle() {
  const spread = 100;
  let div = document.createElement("div");
  div.className = "particle burgerpoints";

  const x = _dragdrop.mouse.x + ((Math.random()-.5) * spread);
  const y = _dragdrop.mouse.y + ((Math.random()-.5) * spread);

  div.style.left = x+"px";
  div.style.top = y+"px";
  div.onanimationend = function() {
    this.remove();
  };

  document.body.appendChild(div);
  playerdata.points++;
  updatePoints();
  sfx("burgerpoints");
}
