class Guy {
  constructor() {
    this.index = game.guys.length;

    const arch = ARCHETYPES[Math.random() * ARCHETYPES.length | 0];

    this.name = arch.name;

    this.generateDesiredMenu(arch.complexity);

    this.createElement(arch);

    this.talkInterval = arch.talkInterval * 3;
    this.talkTime = 0;
    this.voice = arch.voice;
    this.soundIndex = null;
    this.chime = _sounds.chime[arch.chime];

    this.enteredStore = false;
    this.active = true;
    this.words = [];
    this.punctuate = Math.random() < .5 ? true : false;
    this.capitalize = Math.random() < .5 ? true : false;

    this.appreciatesText = false;
    this.expressedAppreciation = 0;

    this.hasRequest = false;
    this.awaitingRequest = false;

    game.guys.push(this);

    this.hangAround();
  }

  createRequest() {
    this.hasRequest = true;
    this.element.classList.add("has-request");
    this.request = new Request(this);

    //

    REQUESTS[Math.random() * REQUESTS.length | 0].init(this);
    if (this.request.compensation.type == "piece") {
      // this.request.compensation.condition = "";
    }

    //

    this.viewRequestButton.classList.remove("gone");
    this.viewRequestButton.dataset.index = this.index;
    this.viewRequestButton.onclick = function() {
      const guy = game.guys[this.dataset.index];
      guy.request.previewForAcceptance();
    };

    this.rejectRequestButton.classList.remove("gone");
    this.rejectRequestButton.dataset.index = this.index;
    this.rejectRequestButton.onclick = function() {
      const guy = game.guys[this.dataset.index];
      guy.removeRequest();
    };

    this.fulfillRequestButton.dataset.index = this.index;
    this.fulfillRequestButton.onclick = function() {
      const guy = game.guys[this.dataset.index];
      guy.request.fulfill();
    }

    this.viewRequestButton.onmousedown =
    this.rejectRequestButton.onmousedown =
    this.fulfillRequestButton.onmousedown =
    function() {
      const guy = game.guys[this.dataset.index];
      guy.dontBringToFront = true;
    };
    this.viewRequestButton.onmouseleave = this.viewRequestButton.onblur = this.viewRequestButton.onmouseup =
    this.rejectRequestButton.onmouseleave = this.rejectRequestButton.onblur = this.rejectRequestButton.onmouseup =
    this.fulfillRequestButton.onmouseleave = this.fulfillRequestButton.onblur = this.fulfillRequestButton.onmouseup =
    function() {
      const guy = game.guys[this.dataset.index];
      guy.dontBringToFront = false;
    };
  }

  fulfillRequest(meetsRules) {
    sfx("click");

    // accepted dialogue

    this.clearDialogue();
    if (meetsRules) {
      var dialogue;

      switch (this.request.compensation.type) {
        case "gift":
          dialogue = "thanks, here's something thing i found";
          tempMessage("<i>An item has been added to your <button onclick='setScene(`kitchen`)'>→ stock</button>.</i>");
          break;

        case "piece":
          dialogue = "thanks. this is for you";
          tempMessage("<i>A piece has been added to your <button onclick='setScene(`kitchen`)'>→ library</button>.</i>");
          break;

        default:
          dialogue = "thank you";
          break;
      }

      this.addString(this.styleText(dialogue, true, null));
      this.element.classList.remove("awaiting-request");
      this.fulfillRequestButton.classList.add("gone");
    } else {
      this.addString(this.styleText("sorry, this isn't what i wanted", true, null));
    }

    if (this.enteredStore) {
      this.createOrderDialogue(true);
    } else {
      this.addPause(10);
    }
  }

  removeRequest() {
    this.hasRequest = false;
    this.request = null;
    this.element.classList.remove("has-request");
    this.viewRequestButton.classList.add("gone");
    this.rejectRequestButton.classList.add("gone");

    // rejection dialogue

    if (this.enteredStore) {
      this.clearDialogue();
      this.addString(this.styleText("aw man", true, null));
      this.createOrderDialogue(true);
    } else {
      this.clearDialogue();
      this.addString(this.styleText("aw man", true, null));
      this.addPause(10);
    }
  }

  acceptRequest() {
    this.request.accept();
    this.element.classList.remove("has-request");
    this.viewRequestButton.classList.add("gone");
    this.rejectRequestButton.classList.add("gone");

    // accepted dialogue

    if (this.enteredStore) {
      this.clearDialogue();
      this.addString(this.styleText("thank you", true, null));
      this.createOrderDialogue(true);
    } else {
      this.clearDialogue();
      this.addString(this.styleText("thank you", true, null));
      this.addPause(10);
    }

    tempMessage("<i>A request has been added to your <button onclick='setScene(`workshop`)'>→ workshop</button>.</i>");
  }

  createRequestDialogue() {
    this.addString(this.styleText("i have a request for you", true, null));
    this.addPause(15);
  }

  createElement(arch) {
    let div = divContainingTemplate("guy");
    let img = div.querySelector("img");
    img.src = arch.source;
    img.alt = img.title = arch.name;

    let text = div.querySelector("[name='text']");
    let number = div.querySelector("[name='number']");
    number.textContent = this.index+1;

    let rejectbutton = div.querySelector("[name='reject']");
    rejectbutton.dataset.index = this.index;
    rejectbutton.onclick = function() {
      game.guys[this.dataset.index].reject();
    }
    this.rejectbutton = rejectbutton;
    this.rejectbutton.onmousedown = function() {
      const guy = game.guys[this.dataset.index];
      guy.dontBringToFront = true;
    };
    this.rejectbutton.onmouseleave = this.rejectbutton.onblur = this.rejectbutton.onmouseup =
    function() {
      const guy = game.guys[this.dataset.index];
      guy.dontBringToFront = false;
    };

    let viewRequestButton = div.querySelector("[name='view-request']");
    this.viewRequestButton = viewRequestButton;
    this.rejectRequestButton = div.querySelector("[name='reject-request']");

    let fulfillRequestButton = div.querySelector("[name='fulfill-request']");
    this.fulfillRequestButton = fulfillRequestButton;

    this.imageElement = img;
    this.textElement = text;
    this.element = div;

    let x = Math.random() * 50 + 25;
    let y = Math.random() * 50 + 10;

    this.element.style.left = x+"%";
    this.element.style.top = y+"%";
  }

  visitFacade() {
    this.dontBringToFront = false;

    this.currentTalkInterval = (Math.random() * 10 + 10) * this.talkInterval;

    this.clearDialogue();

    if (this.hasRequest && !this.request.accepted) {
      this.createRequestDialogue();
      return;
    }

    if (this.request && !this.request.fulfilled && this.request.piece) {
      this.createAwaitRequestDialogue();
    } else if (this.appreciatesText && this.expressedAppreciation < 3 && playerdata.facade.length > 0) {
      this.reactToFacadePiece();
      this.expressedAppreciation++;
    } else {
      let x = Math.random() * 50 + 25;
      let y = Math.random() * 50 + 10;

      this.element.style.left = x+"%";
      this.element.style.top = y+"%";

      if (Math.random() < .3) {
        this.createExteriorDialogue();
      }
    }
  }

  createAwaitRequestDialogue() {
    var dialogue = this.randomLine([
      "have you fulfilled my request"
    ]);

    this.addString(this.styleText(dialogue, true, null));
    this.addPause(15);
  }

  reactToFacadePiece() {
    const piece = playerdata.facade[playerdata.facade.length * Math.random() | 0];

    let x = Math.random() * piece.width;
    let y = Math.random() * piece.height;

    this.element.style.left = "calc("+piece.x+"% + "+x+"px)";
    this.element.style.top = "calc("+piece.y+"% + "+y+"px)";

    var style = null;
    var dialogue = this.randomLine([
      // "hey, nice writing",
      // "i like this text on the wall",
      // "did you write this",
      '"[random line]"...'
    ]);

    if (dialogue.includes("[random line]")) {
      dialogue = dialogue.replace("[random line]", randomLine(piece.text));
      style = "italicized";
    }

    this.addString(this.styleText(dialogue, true, null), style);
    this.addPause(15);
  }

  createExteriorDialogue() {
    // this.words = [];
    this.addPause(Math.random() * 5);

    var dialogue;
    if (game.storetime == -1) {
      if (game.daytime) {
        // waiting for the store to open

        dialogue = this.randomLine([
          "", "",
          "hello", "hi", "hallo", "morning", "good morning",
          "open the store", "when does the store open",
          "hungry", "i'm hungry", "so hungry",
          "bored", "kinda bored", "i'm bored",
          "boo",
          "Burgeria"
        ]);
      } else {
        // overtime

        dialogue = this.randomLine([
          "", "",
          "zzz", "sleepy",
          "i've been waiting for so long", "how much longer", "what's the hold up"
        ]);
      }
    } else {
      // store is open

      dialogue = this.randomLine([
        "", "",
        "wonder what i'll get", "what's on the menu", "wait for me",
        "hungry", "i'm hungry", "so hungry",
        "time to eat"
      ]);
    }

    if (dialogue == "") {
      this.addString(this.randomPunctuateLine(""));
    } else {
      this.addString(this.styleText(dialogue, true, null));
    }

    this.addPause(15);
  }

  createLeavingDialogue() {
    var dialogue = this.randomLine([
      "goodbye", "bye bye", "bye", "farewell", "see ya", "see you", "aw man"
    ]);

    this.addString(this.styleText(dialogue, true, null));
  }

  hangAround() {
    this.element.style.position = "absolute";
    this.element.onclick = function() {
      ui.scenes.facade.appendChild(this);
    }

    ui.scenes.facade.appendChild(this.element);
  }

  visitStorefront() {
    if (this.request && !this.request.fulfilled && this.request.piece) {
      this.clearDialogue();
      this.createAwaitRequestDialogue();
    }
  }

  enterStore() {
    this.element.onclick = null;
    this.element.style.position = "unset";

    this.clearDialogue();
    if (this.request && !this.request.fulfilled && this.request.piece) {
      this.createAwaitRequestDialogue();
    } else if (!this.hasRequest || this.request.accepted) {
      this.createOrderDialogue();
    } else {
      this.createRequestDialogue();
    }

    this.textElement.classList.remove("gone");
    ui.storefront.day.guysContainer.appendChild(this.element);

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

    this.served = false;
    this.enteredStore = true;

    this.chime.play();

    updateGuysList();

    this.currentTalkInterval = 20 + 10 * this.talkInterval;
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

  clearDialogue() {
    while (this.textElement.lastElementChild) {
      this.textElement.lastElementChild.remove();
    }
    this.textElement.classList.add("gone");
    this.words = [];
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

  createOrderDialogue(skipGreeting) {
    let menu = this.desiredMenu;

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

    if (!skipGreeting) this.addString(greeting);
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
    if (this.textElement.classList.contains("gone")) {
      this.textElement.classList.remove("gone");
    }

    if (!el.classList.contains("pause")) {
      this.soundIndex = sfx_talk(this.voice, this.soundIndex);
      if (!this.enteredStore && !this.dontBringToFront) {
        ui.scenes.facade.appendChild(this.element);
      }
      this.element.firstElementChild.classList.add("speaking");
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
      this.element.firstElementChild.classList.remove("speaking");
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
    this.element.dataset.index = this.index;
    this.element.classList.add("removing-ticket");
    this.element.addEventListener("animationend", function(e) {
      let guy = game.guys[this.dataset.index];
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
      const dialogue = this.randomLine([
        "wait i wasn't done talking",
        "what",
        "wait what",
        "oh ok",
        "ah excuse me"
      ]);
      this.words = [];
      this.addString(dialogue);
      this.addPause(10);
    } else {
      this.clearDialogue();
      this.createLeavingDialogue();
      this.addPause(15);
    }

    this.rejected = true;

    this.rejectbutton.setAttribute("disabled", true);
  }

  delete(simpleDelete) {
    this.active = false;

    this.element.remove();

    updateGuysList();

    if (simpleDelete) return;

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
