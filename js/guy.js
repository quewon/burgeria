class Guy {
  constructor() {
    this.index = game.guys.length;

    const arch = ARCHETYPES[Math.random() * ARCHETYPES.length | 0];

    this.complexity = arch.complexity;

    this.name = arch.name;

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

  updateLanguage() {
    if (this.hasRequest) {
      for (let rule of this.request.rules) {
        rule.updateLanguage();
      }
    }

    if (this.enteredStore) {
      this.clearDialogue();
      if (this.request && !this.request.fulfilled && this.request.piece) {
        this.createAwaitRequestDialogue();
      } else if (!this.hasRequest || this.request.accepted) {
        this.createOrderDialogue();
      } else {
        this.createRequestDialogue();
      }
    }
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
          dialogue = localized("DIALOGUE", "REQUEST_FULFILLED_GIFT");
          tempMessage(localized("UI", "F_ADDED_ITEM"));
          break;

        case "piece":
          dialogue = localized("DIALOGUE", "REQUEST_FULFILLED_PIECE");
          tempMessage(localized("UI", "F_ADDED_PIECE"));
          break;

        default:
          dialogue = localized("DIALOGUE", "REQUEST_FULFILLED");
          break;
      }

      this.addString(this.styleText(dialogue, true, null));
      this.element.classList.remove("awaiting-request");
      this.fulfillRequestButton.classList.add("gone");
    } else {
      this.addString(this.styleText(localized("DIALOGUE", "REQUEST_WRONG"), true, null));
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

    this.clearDialogue();
    this.addString(this.styleText(localized("DIALOGUE", "REQUEST_REMOVED"), true, null));

    if (this.enteredStore) {
      this.createOrderDialogue(true);
    } else {
      this.addPause(10);
    }
  }

  acceptRequest() {
    this.request.accept();
    this.element.classList.remove("has-request");
    this.viewRequestButton.classList.add("gone");
    this.rejectRequestButton.classList.add("gone");

    // accepted dialogue

    this.clearDialogue();
    this.addString(this.styleText(localized("DIALOGUE", "REQUEST_ACCEPTED"), true, null));
    if (this.enteredStore) {
      this.createOrderDialogue(true);
    } else {
      this.addPause(10);
    }

    tempMessage(localized("UI", "F_ADDED_REQUEST"));
  }

  createRequestDialogue() {
    this.addString(this.styleText(localized("DIALOGUE", "REQUEST"), true, null));
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
      localized("DIALOGUE", "REQUEST_WAITING")
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

    this.addString(this.styleText(dialogue, null, null), style);
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
          localized("DIALOGUE", "WAIT_1"),
          localized("DIALOGUE", "WAIT_2"),
          localized("DIALOGUE", "WAIT_3"),
          localized("DIALOGUE", "WAIT_4"),
          localized("DIALOGUE", "WAIT_5"),
          localized("DIALOGUE", "WAIT_6"),
          localized("DIALOGUE", "WAIT_7"),
          localized("DIALOGUE", "WAIT_8"),
          localized("DIALOGUE", "WAIT_9"),
          localized("DIALOGUE", "WAIT_10"),
          localized("DIALOGUE", "WAIT_11"),
          localized("DIALOGUE", "WAIT_12"),
          localized("DIALOGUE", "WAIT_13"),
          localized("DIALOGUE", "WAIT_14"),
          localized("DIALOGUE", "WAIT_15"),
        ]);
      } else {
        // overtime

        dialogue = this.randomLine([
          "", "",
          localized("DIALOGUE", "OVERTIME_1"),
          localized("DIALOGUE", "OVERTIME_2"),
          localized("DIALOGUE", "OVERTIME_3"),
          localized("DIALOGUE", "OVERTIME_4"),
          localized("DIALOGUE", "OVERTIME_5"),
        ]);
      }
    } else {
      // store is open

      dialogue = this.randomLine([
        "", "",
        localized("DIALOGUE", "STORE_OPEN_1"),
        localized("DIALOGUE", "STORE_OPEN_2"),
        localized("DIALOGUE", "STORE_OPEN_3"),
        localized("DIALOGUE", "STORE_OPEN_4"),
        localized("DIALOGUE", "STORE_OPEN_5"),
        localized("DIALOGUE", "STORE_OPEN_6"),
        localized("DIALOGUE", "STORE_OPEN_7"),
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
      localized("DIALOGUE", "LEAVE_1"),
      localized("DIALOGUE", "LEAVE_2"),
      localized("DIALOGUE", "LEAVE_3"),
      localized("DIALOGUE", "LEAVE_4"),
      localized("DIALOGUE", "LEAVE_5"),
      localized("DIALOGUE", "LEAVE_6"),
      localized("DIALOGUE", "LEAVE_7"),
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
    this.generateDesiredMenu(this.complexity);

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
      // "?", "?!"
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
      localized("DIALOGUE", "ORDER_OPENER_COMMON_1"),
      localized("DIALOGUE", "ORDER_OPENER_COMMON_1"),
      localized("DIALOGUE", "ORDER_OPENER_COMMON_1"),
      localized("DIALOGUE", "ORDER_OPENER_COMMON_2"),
      localized("DIALOGUE", "ORDER_OPENER_COMMON_2"),
      localized("DIALOGUE", "ORDER_OPENER_COMMON_2"),
      localized("DIALOGUE", "ORDER_OPENER_3"),
      localized("DIALOGUE", "ORDER_OPENER_3"),
      localized("DIALOGUE", "ORDER_OPENER_UNCOMMON_4"),
      localized("DIALOGUE", "ORDER_OPENER_UNCOMMON_5"),
      localized("DIALOGUE", "ORDER_OPENER_UNCOMMON_6"),
    ]);
    const request = this.randomLine([
      localized("DIALOGUE", "ORDER_REQUEST_1"),
      localized("DIALOGUE", "ORDER_REQUEST_2"),
      localized("DIALOGUE", "ORDER_REQUEST_3"),
      localized("DIALOGUE", "ORDER_REQUEST_4"),
      localized("DIALOGUE", "ORDER_REQUEST_5"),
      localized("DIALOGUE", "ORDER_REQUEST_6"),
      localized("DIALOGUE", "ORDER_REQUEST_7"),
      localized("DIALOGUE", "ORDER_REQUEST_8"),
    ], true);
    const signoff = this.randomLine([
      "", "", "",
      localized("DIALOGUE", "ORDER_SIGNOFF_COMMON_1"),
      localized("DIALOGUE", "ORDER_SIGNOFF_COMMON_1"),
      localized("DIALOGUE", "ORDER_SIGNOFF_COMMON_2"),
      localized("DIALOGUE", "ORDER_SIGNOFF_COMMON_2"),
      localized("DIALOGUE", "ORDER_SIGNOFF_3"),
      localized("DIALOGUE", "ORDER_SIGNOFF_4"),
      localized("DIALOGUE", "ORDER_SIGNOFF_5"),
      localized("DIALOGUE", "ORDER_SIGNOFF_6"),
      localized("DIALOGUE", "ORDER_SIGNOFF_7"),
      localized("DIALOGUE", "ORDER_SIGNOFF_8"),
      localized("DIALOGUE", "ORDER_SIGNOFF_9"),
      localized("DIALOGUE", "ORDER_SIGNOFF_10"),
      localized("DIALOGUE", "ORDER_SIGNOFF_11"),
      localized("DIALOGUE", "ORDER_SIGNOFF_12"),
      localized("DIALOGUE", "ORDER_SIGNOFF_13"),
      localized("DIALOGUE", "ORDER_SIGNOFF_14"),
      localized("DIALOGUE", "ORDER_SIGNOFF_15"),
    ]);

    if (!skipGreeting) this.addString(greeting);

    var splitRequest = request.split(/\[|\]/g);
    for (let section of splitRequest) {
      if (section == "menu") {
        this.addString(menu.name, "order");
      } else {
        this.addString(section);
      }
    }
    this.addString(this.randomPunctuateLine(""));

    const and = localized("DIALOGUE", "ORDER_CONCAT");
    const but = localized("DIALOGUE", "REPLACE_CONCAT");

    if (menu.deviations.length > 0) {
      const deviations = menu.deviations;
      for (let i=0; i<deviations.length; i++) {
        const deviation = deviations[i];
        switch (deviation.type) {
          case "remove":
            if (i>0) {
              this.addString(and, true);
            }

            // without any [item]
            this.addString(this.styleText(
              localized("DIALOGUE", "ORDER_REMOVE").replace("[item]", deviation.item),
              true, i>0), "em");
            this.addString(".");
            break;
          case "replace":
            if (i==0) {
              this.addString(this.styleText(but, true));
            } else {
              this.addString(this.styleText(and, true));
            }

            var replaceDialogue = this.randomLine([
              "", "", "",
              localized("DIALOGUE", "ORDER_REPLACE_1"),
              localized("DIALOGUE", "ORDER_REPLACE_2"),
              localized("DIALOGUE", "ORDER_REPLACE_3"),
            ]);
            replaceDialogue = this.styleText(replaceDialogue, true, true);
            replaceDialogue = replaceDialogue.split(/<em>|<\/em>/g);

            for (let section of replaceDialogue) {
              if (section == "") continue;
              if (section.includes("[to]")) {
                this.addString(section.replace("[to]", deviation.to).replace("[from]", deviation.from), "em");
              } else {
                this.addString(section);
              }
            }
            // this.addString(question ? "?" : ".");
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
        localized("DIALOGUE", "REJECT_INTERRUPT_1"),
        localized("DIALOGUE", "REJECT_INTERRUPT_2"),
        localized("DIALOGUE", "REJECT_INTERRUPT_3"),
        localized("DIALOGUE", "REJECT_INTERRUPT_4"),
        localized("DIALOGUE", "REJECT_INTERRUPT_5")
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
      "tray_has_nothing": localized("DIALOGUE", "FEEDBACK_TRAY_HAS_NOTHING"),
      "categories_missing": localized("DIALOGUE", "FEEDBACK_CATEGORIES_MISSING"),
      "categories_in_wrong_order": localized("DIALOGUE", "FEEDBACK_CATEGORIES_IN_WRONG_ORDER"),
      "categories_swapped": localized("DIALOGUE", "FEEDBACK_CATEGORIES_SWAPPED"),
      "categories_mixed_up": localized("DIALOGUE", "FEEDBACK_CATEGORIES_MIXED_UP"),
      "unwanted_categories": localized("DIALOGUE", "FEEDBACK_UNWANTED_CATEGORIES"),
      "unwanted_items": localized("DIALOGUE", "FEEDBACK_UNWANTED_ITEMS"),
      "items_missing": localized("DIALOGUE", "FEEDBACK_ITEMS_MISSING"),
      "categories_overfilled": localized("DIALOGUE", "FEEDBACK_CATEGORIES_OVERFILLED"),
      "items_misplaced": localized("DIALOGUE", "FEEDBACK_ITEMS_MISPLACED"),
    };

    const localizeCategory = function(string) {
      switch (string) {
        case "burger":
          return localized("UI", "PLACEHOLDER_BURGER");
          break;
        case "drink":
          return localized("UI", "PLACEHOLDER_DRINK");
          break;
        case "side":
          return localized("UI", "PLACEHOLDER_SIDE");
          break;
      }
    }

    for (let i=priority.length-1; i>=0; i--) {
      let f = feedback[priority[i]];
      f = f.constructor === Array ? f[0] : f;

      var isCategories = priority[i].includes("categor");

      if (f) {
        text = dialogue[priority[i]];
        if (typeof f === "string") {
          if (isCategories) f = localizeCategory(f);
          text = text.replace("[item]", f);
        } else {
          for (let property in f) {
            if (isCategories) f = localizeCategory(f);
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
