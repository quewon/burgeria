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
    this.served = false;

    this.talkInterval = arch.talkInterval * 3;
    this.talkTime = 0;
    // this.currentTalkInterval = 5 * this.talkInterval;
    this.currentTalkInterval = 100;

    this.tray = new tray(this);
    this.tray.deploy();
    _sounds.chime[arch.chime].play();

    playerdata.guys.push(this);
  }

  generateDesiredMenu() {
    const originalRecipe = playerdata.recipes[Math.random() * playerdata.recipes.length | 0];
    // const originalRecipe = playerdata.recipes[1];

    let construction = originalRecipe.construction;

    this.desiredMenu = new recipe({
      name: originalRecipe.name,
      cost: originalRecipe.cost,
      construction: construction
    });
  }

  createDialogue() {
    let menu = this.desiredMenu;

    this.words = [];
    this.addString("hi i would like the", "span");
    this.addString(menu.name, "em");
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
    if (scenes.storefront.ministockTray) scenes.storefront.ministockTray.updateMinistockPosition();
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

    this.served = true;
    this.element.dataset.id = this.id;
    this.element.classList.add("removing-ticket");
    this.element.addEventListener("animationend", function(e) {
      let guy = playerdata.guys[this.dataset.id];
      guy.element.remove();

      // check: am i done serving everybody?
      // if so, allow player to start the day up again!
      if (playerdata.storetime == -1) {
        for (let guy of playerdata.guys) {
          if (!guy.served) return;
        }
        _game.beginDay();
      }
    });

    const feedback = this.tray.requestFeedback(this.desiredMenu);
    if (feedback == null) {
      for (let i=0; i<this.desiredMenu.cost; i++) {
        setTimeout(burgerpointParticle, Math.random() * 100 * this.desiredMenu.cost);
      }
    } else {
      this.sendFeedback(feedback);
    }
  }

  sendFeedback(feedback) {
    let div = divContainingTemplate("template-feedback-napkin");
    div.querySelector("[name='text']").textContent = feedback;
    div.className = "slide-up";
    scenes.storefront.news.prepend(div);
    sfx("scrawl");
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
