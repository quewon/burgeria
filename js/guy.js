var ARCHETYPES = [
  {
    name: "fish",
    source: "img/fish.png",
    chime: 0,
    complexity: 0,
    talkInterval: .7,
    voice: "ka"
  },
  {
    name: "dog",
    source: "img/dog.png",
    chime: 0,
    complexity: 1,
    talkInterval: 1.5,
    voice: "wa"
  },
  {
    name: "monkeey",
    source: "img/monkey.png",
    chime: 1,
    complexity: 1,
    talkInterval: 1,
    voice: "pa"
  },
  {
    name: "cat",
    source: "img/cat.png",
    chime: 2,
    complexity: 2,
    talkInterval: 2,
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
];

class Guy {
  constructor() {
    this.id = game.guys.length;

    const arch = ARCHETYPES[Math.random() * ARCHETYPES.length | 0];

    this.generateDesiredMenu(arch.complexity);

    this.createElement(arch);

    this.talkInterval = arch.talkInterval * 3;
    this.talkTime = 0;
    this.currentTalkInterval = 20 + 10 * this.talkInterval;
    this.voice = arch.voice;
    this.soundId = null;
    this.chime = _sounds.chime[arch.chime];

    this.enteredStore = false;
    this.active = true;
    this.words = [];

    game.guys.push(this);

    // this.enterStore();
  }

  createElement(arch) {
    let div = divContainingTemplate("guy");
    let img = div.querySelector("img");
    img.src = arch.source;
    img.alt = img.title = arch.name;

    let text = div.querySelector("[name='text']");
    let number = div.querySelector("[name='number']");
    number.textContent = this.id+1;

    let rejectbutton = div.querySelector("[name='reject']");
    rejectbutton.dataset.index = this.id;
    rejectbutton.onclick = function() {
      game.guys[this.dataset.index].reject();
    }
    this.rejectbutton = rejectbutton;

    this.imageElement = img;
    this.textElement = text;
    this.element = div;
  }

  enterStore() {
    ui.storefront.day.guysContainer.appendChild(this.element);
    updateGuysList();

    // this is only necessary if scrolling happens
    // wish there was a 'did the scrollbar appear/disappear' event listener in js
    if (ui.storefront.guysListTray) {
      const tray = ui.storefront.guysListTray;
      tray.updateGlobalBlockPosition("guysList", tray.sendbutton);
    }
    if (ui.storefront.ministockTray) {
      const tray = ui.storefront.ministockTray;
      tray.updateGlobalBlockPosition("ministock", tray.stockbutton);
    }

    this.createDialogue();
    this.served = false;
    this.enteredStore = true;

    this.chime.play();

    updateGuysList();
  }

  generateDesiredMenu(complexity) {
    const originalRecipe = playerdata.recipes[Math.random() * playerdata.recipes.length | 0];
    var newRecipe = originalRecipe.copy();

    //

    complexity = Math.ceil(Math.random() * complexity);
    // you shouldn't be able to change everything in a recipe
    if (complexity >= newRecipe.uniqueIngredients) complexity = newRecipe.uniqueIngredients - 1;

    for (let i=0; i<complexity; i++) {
      newRecipe.deviate();
    }

    this.desiredMenu = newRecipe;
  }

  styleText(text, dontPunctuate, dontCapitalize) {
    dontPunctuate = dontPunctuate || !this.punctuate;
    dontCapitalize = dontCapitalize || !this.capitalize;

    if (!dontCapitalize && text!="") {
      text = text.charAt(0).toUpperCase() + text.slice(1);
    }
    if (this.capitalize) {
      text = text.replaceAll("i ", "I ");
    }
    if (!dontPunctuate) {
      text = this.randomPunctuateLine(text);
    }

    return text;
  }

  randomPunctuateLine(line) {
    const punctuation = [
      ".", ".", ".",
      "!", "!",
      "...",
      "!!!",
      "?", "?!"
    ];
    return line+punctuation[punctuation.length * Math.random() | 0];
  }

  randomLine(arr, notEnd, notBeginning) {
    let a = arr[arr.length * Math.random() | 0];
    if (a != "") {
      a = this.styleText(a, notEnd);
      if (notBeginning && a[0]!="I") {
        a = a[0].toLowerCase() + a.slice(1);
      }
    }
    return a;
  }

  isPunctuated(text) {
    return text!="" && "...???!!!".includes(text.charAt(text.length - 1));
  }

  createDialogue() {
    let menu = this.desiredMenu;
    this.words = [];

    this.punctuate = Math.random() < .5 ? true : false;
    this.capitalize = Math.random() < .5 ? true : false;

    const greeting = this.randomLine([
      "", "",
      "hello", "hello", "hello",
      "hi", "hi", "hi",
      "um",
      "hmm", "hmm",
      "ey",
      "greetings",
    ]);
    const request = this.randomLine([
      "i would like the",
      "can i have the",
      "give me the",
      "gotta go for the",
      "i'll have the",
      "i'm craving the",
      "make me the",
      "i want the"
    ], true);
    const signoff = this.randomLine([
      "", "", "",
      "thank you", "thank you", "thank you :)",
      "thanks", "thanks", "thanks :)",
      "i love Burgeria", "i hate burgeria", "i am indifferent to Burgeria",
      "make it tasty",
      "can't wait",
      "eh",
      "yeah",
      "yes",
      "please and thank you",
      ":)", ":D"
    ]);

    this.addString(greeting);
    this.addString(request);
    this.addString(menu.name, "order");
    this.addString(this.randomPunctuateLine(""));

    if (menu.deviations.length > 0) {
      const deviations = menu.deviations;
      for (let i=0; i<deviations.length; i++) {
        const deviation = deviations[i];
        switch (deviation.type) {
          case "remove":
            if (i>0) {
              this.addString("and", true);
            }

            this.addString(this.styleText("without any "+deviation.item, true, i>0), "em");
            this.addString(".");
            break;
          case "replace":
            if (i==0) {
              this.addString(this.styleText("but", true));
            } else {
              this.addString(this.styleText("and", true));
            }

            var question = Math.random() < .5 ? true : false;
            if (question) {
              this.addString(this.styleText("can i have", true, true));
            } else {
              this.addString(this.randomLine(["give me", "i want"], true, true));
            }
            this.addString(deviation.to+" instead of "+deviation.from, "em");
            this.addString(question ? "?" : ".");
            break;
        }
      }
    }

    this.addString(signoff);
  }

  addString(string, classname) {
    if (string=="") return;

    for (let word of string.split(" ")) {
      let el = document.createElement("span");
      el.className = (classname || "") + " gone";
      el.textContent = word;
      this.words.push(el);
      this.textElement.appendChild(el);
    }
  }

  addPause(length) {
    let el = document.createElement("span");
    el.className = "pause gone";
    el.dataset.length = length;
    el.textContent = "";
    this.words.push(el);
    this.textElement.appendChild(el);
  }

  updateTalk() {
    let el = this.words.shift();
    el.classList.remove("gone");

    if (!el.classList.contains("pause")) {
      this.soundId = sfx_talk(this.voice, this.soundId);
    }

    if (this.words.length > 0) {
      let length = this.words[0].textContent.length;
      if (this.words[0].classList.contains("pause")) {
        length = Number(this.words[0].dataset.length);
      }

      this.currentTalkInterval = length * this.talkInterval;
    } else {
      this.currentTalkInterval = -1;
    }
    if (ui.storefront.ministockTray) {
      const tray = ui.storefront.ministockTray;
      tray.updateGlobalBlockPosition("ministock", tray.stockbutton);
    }
  }

  draw() {
    if (!this.active) return;

    if (this.words.length == 0) {
      if (this.rejected) {
        this.delete();
      }
      return;
    }

    this.talkTime++;
    if (this.talkTime >= this.currentTalkInterval) {
      this.talkTime = 0;
      this.updateTalk();
    }
  }

  receive(tray) {
    this.served = true;
    updateGuysList();
    this.element.dataset.id = this.id;
    this.element.classList.add("removing-ticket");
    this.element.addEventListener("animationend", function(e) {
      let guy = game.guys[this.dataset.id];
      guy.delete();
    });

    const feedback = tray.requestFeedback(this.desiredMenu);
    if (feedback.tray_is_perfect) {
      var points = game.storetime == -1 ? Math.ceil(this.desiredMenu.cost/2) : this.desiredMenu.cost;
      game.unbankedPoints += points;
      for (let i=0; i<points; i++) {
        setTimeout(burgerpointParticle, Math.random() * 100 * points);
      }
    }
    this.sendFeedback(feedback, tray);
  }

  reject() {
    if (this.words.length > 0) {
      const dialogue = "wait i wasn't done talking";
      this.words = [];
      this.addString(dialogue);
      this.addPause(10);
    } else {
      while (this.textElement.lastElementChild) {
        this.textElement.lastElementChild.remove();
      }
      this.addString("bye bye");
      this.addPause(15);
    }

    this.rejected = true;

    this.rejectbutton.setAttribute("disabled", true);
  }

  delete() {
    this.active = false;

    this.element.remove();

    // check: am i done serving everybody?
    // if so, allow player to start the day up again!
    if (game.storetime == -1) {
      for (let guy of game.guys) {
        if (guy.enteredStore && guy.active) return;
      }
      game.beginDay();
    }
  }

  sendFeedback(feedback, tray) {
    console.log(feedback);

    let text = "";

    const priority = [
      "tray_has_nothing",
      "categories_swapped",
      "categories_mixed_up",
      "unwanted_categories",
      "unwanted_items",
      "categories_missing",
      "items_missing",
      "categories_overfilled",
      "items_misplaced",
      "categories_in_wrong_order",
    ];
    const dialogue = {
      "tray_has_nothing": "this tray has nothing on it!",
      "categories_missing": "i didn't get my [item]...",
      "categories_in_wrong_order": "[item] was in the wrong order.",
      "categories_swapped": "the [a] and the [b] got mixed up.",
      "categories_mixed_up": "my [should_be] was in the wrong spot!",
      "unwanted_categories": "haha, free [item]!",
      "unwanted_items": "why was there [item] in my [category]?",
      "items_missing": "my [category] was missing [item]...",
      "categories_overfilled": "there was too much stuff in my [item].",
      "items_misplaced": "this [item] was in the wrong spot.",
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
      text = this.styleText(text, true);

      let div = divContainingTemplate("feedback-napkin");
      div.querySelector("[name='text']").textContent = text;

      // ui.storefront.news.appendChild(div);
      ui.storefront.body.insertBefore(div, tray.element.nextSibling);

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
  sfx("burgerpoints");
}
