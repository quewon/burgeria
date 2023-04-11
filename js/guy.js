class guy {
  constructor() {
    this.id = playerdata.guys.length;

    const archs = [
      {
        name: "cat",
        source: "img/cat.png",
        chime: 0,
        complexity: 2,
        talkInterval: 2,
        voice: "pa"
      },
      {
        name: "fish",
        source: "img/fish.png",
        chime: 1,
        complexity: 0,
        talkInterval: .7,
        voice: "ka"
      },
      {
        name: "monkeey",
        source: "img/monkey.png",
        chime: 2,
        complexity: 1,
        talkInterval: 1,
        voice: "pa"
      },
      {
        name: "mouse",
        source: "img/mouse.png",
        chime: 3,
        complexity: 3,
        talkInterval: .5,
        voice: "wa"
      },
      {
        name: "dog",
        source: "img/dog.png",
        chime: 0,
        complexity: 1,
        talkInterval: 1.5,
        voice: "wa"
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

    this.generateDesiredMenu(arch.complexity);
    this.createDialogue();
    this.served = false;

    this.talkInterval = arch.talkInterval * 3;
    this.talkTime = 0;
    this.currentTalkInterval = 15 * this.talkInterval;
    this.voice = arch.voice;
    this.soundId = null;
    // this.currentTalkInterval = 50;

    this.tray = new tray(this);
    this.tray.deploy();
    _sounds.chime[arch.chime].play();

    playerdata.guys.push(this);
  }

  generateDesiredMenu(complexity) {
    const originalRecipe = playerdata.recipes[Math.random() * playerdata.recipes.length | 0];

    let construction = {};
    for (let side in originalRecipe.construction) {
      let b = originalRecipe.construction[side];
      if (b.constructor === Array) {
        construction[side] = [];
        for (let item of b) {
          construction[side].push(item);
        }
      } else {
        construction[side] = b;
      }
    }

    var newRecipe = new recipe({
      name: originalRecipe.name,
      cost: originalRecipe.cost,
      construction: construction
    });

    //

    complexity = Math.ceil(Math.random() * complexity);
    // complexity should not overcome size of recipe

    for (let i=0; i<complexity; i++) {
      newRecipe.deviate();
    }

    this.desiredMenu = newRecipe;

    console.log(construction);
  }

  createDialogue() {
    let menu = this.desiredMenu;
    this.words = [];

    this.addString("hi i would like the");
    this.addString(menu.name, "order");

    if (menu.deviations.length > 0) {
      const deviations = menu.deviations;
      for (let i=0; i<deviations.length; i++) {
        const deviation = deviations[i];
        switch (deviation.type) {
          case "remove":
            this.addString("without the "+deviation.item, "em");
            if (i<deviations.length-1 && deviations[i+1].type == "remove") {
              this.addString("and");
            }
            break;
          case "replace":
            if (i==0) {
              this.addString("but");
            } else {
              this.addString("and");
            }
            this.addString("can i have");
            this.addString(deviation.to+" instead of "+deviation.from, "em");
            this.addString("?");
            break;
        }
      }
    }

    this.addString("thanks :)");
  }

  addString(string, classname) {
    for (let word of string.split(" ")) {
      let el = document.createElement("span");
      el.className = (classname || "") + " gone";
      el.textContent = word;
      this.words.push(el);
      this.textElement.appendChild(el);
    }
  }

  updateTalk() {
    let el = this.words.shift();
    el.classList.remove("gone");
    this.currentTalkInterval = el.textContent.length * this.talkInterval;
    this.soundId = sfx_talk(this.voice, this.soundId);
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
    if (feedback.tray_is_perfect) {
      for (let i=0; i<this.desiredMenu.cost; i++) {
        setTimeout(burgerpointParticle, Math.random() * 100 * this.desiredMenu.cost);
      }
    }
    this.sendFeedback(feedback);
  }

  sendFeedback(feedback) {
    let text = "";

    const priority = [
      "tray_has_nothing",
      "categories_swapped",
      "categories_mixed_up",
      "categories_missing",
      "unwanted_items",
      "items_missing",
      "items_misplaced",
      "categories_in_wrong_order",
      "unwanted_categories",
    ];
    const dialogue = {
      "tray_has_nothing": "this tray has nothing on it!",
      "categories_missing": "i didn't get my [item]...",
      "categories_in_wrong_order": "[item] was in the wrong order.",
      "categories_swapped": "[a] and [b] got mixed up.",
      "categories_mixed_up": "my [should_be] was where my [category] should be.",
      "unwanted_categories": "haha, free [item]!",
      "unwanted_items": "why was there [item] in my [category]?",
      "items_missing": "my [category] was missing [item]...",
      "items_misplaced": "this [item] was in the wrong spot",
    };
    for (let i=priority.length-1; i>=0; i--) {
      let f = feedback[priority[i]];
      f = f.constructor === Array ? f[0] : f;
      if (f) {
        text = dialogue[priority[i]];
        if (typeof f === "string") {
          text = text.replace("[item]", f);
        } else {
          for (let property in f) {
            text = text.replace("["+property+"]", f[property]);
          }
        }
      }
    }

    if (text != "") {
      let div = divContainingTemplate("template-feedback-napkin");
      div.querySelector("[name='text']").textContent = text;
      div.className = "slide-up";
      scenes.storefront.news.prepend(div);
      sfx("scrawl");
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
