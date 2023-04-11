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
      },
      {
        name: "fish",
        source: "img/fish.png",
        chime: 1,
        complexity: 0,
        talkInterval: .7,
      },
      {
        name: "monkeey",
        source: "img/monkey.png",
        chime: 2,
        complexity: 1,
        talkInterval: 1,
      },
      {
        name: "mouse",
        source: "img/mouse.png",
        chime: 3,
        complexity: 3,
        talkInterval: .5,
      },
      {
        name: "dog",
        source: "img/dog.png",
        chime: 0,
        complexity: 1,
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

    this.generateDesiredMenu(arch.complexity);
    this.createDialogue();
    this.served = false;

    this.talkInterval = arch.talkInterval * 3;
    this.talkTime = 0;
    this.currentTalkInterval = 15 * this.talkInterval;
    // this.currentTalkInterval = 50;

    this.tray = new tray(this);
    this.tray.deploy();
    _sounds.chime[arch.chime].play();

    playerdata.guys.push(this);
  }

  generateDesiredMenu(complexity) {
    // const originalRecipe = playerdata.recipes[Math.random() * playerdata.recipes.length | 0];
    const originalRecipe = playerdata.recipes[0];
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

    let deviations = [];
    switch (complexity) {
      case 1:
        // replace drink or side
        break;
      case 2:
        // replace ingredient
        break;
      case 3:
        // replace drink or side + ingredient
        break;
    }

    construction.burger.splice(construction.burger.indexOf("patty"), 1);
    deviations.push({
      type: "remove",
      side: "burger",
      item: "patty"
    });
    console.log(construction);

    this.desiredMenu = new recipe({
      name: originalRecipe.name,
      cost: originalRecipe.cost,
      construction: construction,
      deviationsFromOriginal: deviations
    });
  }

  createDialogue() {
    let menu = this.desiredMenu;
    this.words = [];

    this.addString("hi i would like the", "span");
    this.addString(menu.name, "em");

    if (menu.deviationsFromOriginal.length > 0) {
      const deviations = menu.deviationsFromOriginal;
      for (let deviation of deviations) {
        const item = deviation.item;
        switch (deviation.type) {
          case "remove":
            this.addString("without the "+item);
            break;
        }
      }
    }

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
    if (feedback.tray_is_perfect) {
      for (let i=0; i<this.desiredMenu.cost; i++) {
        setTimeout(burgerpointParticle, Math.random() * 100 * this.desiredMenu.cost);
      }
    }
    this.sendFeedback(feedback);
  }

  sendFeedback(feedback) {
    // feedback looks like {
    //   tray_has_nothing: true,
    //   tray_is_perfect: true,
    //   categories_in_wrong_order: [],
    //   categories_missing: [],
    //   categories_mixed_up: [
    //     {
    //       category: "",
    //       should_be: "",
    //     }
    //   ],
    //   items_missing: [
    //     {
    //       category: "",
    //       item: ""
    //     }
    //   ],
    //   items_misplaced: [
    //     {
    //       category: "",
    //       item: "",
    //     }
    //   ],
    //   unwanted_categories: [],
    //   unwanted_items: [
    //     {
    //       category: "",
    //       item: ""
    //     }
    //   ],
    // }
    let text = "";

    console.log(feedback);

    const priority = [
      "tray_has_nothing",
      "categories_missing",
      "unwanted_categories",
      "unwanted_items",
      "items_missing",
      "items_misplaced",
      "categories_in_wrong_order",
      "categories_mixed_up"
    ];
    const dialogue = {
      "tray_has_nothing": "this tray has nothing on it!",
      "categories_missing": "i didn't get my [item]...",
      "unwanted_categories": "haha, free [item]!",
      "unwanted_items": "why was there [item] in my [category]?",
      "items_missing": "my [category] was incomplete...",
      "items_misplaced": "this [item] was in the wrong spot",
      "categories_in_wrong_order": "[item] was in the wrong order.",
      "categories_mixed_up": "[category] and [should_be] got mixed up."
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
