class RequestRule {
  constructor(p) {
    this.type = p.type;
    this.condition = p.condition;

    //<li>must contain the word <span class="monospace"><em>MOTHER</em></span>.</li>
    //<li>must be <em>30 characters or longer</em>.</li>

    this.element = document.createElement("div");
    switch (this.type) {
      case "startString":
        this.element.innerHTML = "must begin with <span class='monospace'><em>"+this.condition+"</em></span>.";
        break;

      case "endString":
        this.element.innerHTML = "must end with <span class='monospace'><em>"+this.condition+"</em></span>.";
        break;

      case "contain":
        this.element.innerHTML = "must contain <span class='monospace'><em>"+this.condition+"</em></span>.";
        break;

      case "minLetterCount":
        this.element.innerHTML = "must be "+p.condition+" letters or longer.";
        break;
    }
  }

  check(text) {
    text = text.toLowerCase();

    this.element.classList.remove("strikethrough");

    switch (this.type) {
      case "startString":
        if (text.indexOf(this.condition) == 0) {
          this.element.classList.add("strikethrough");
          return true;
        }
        break;

      case "endString":
        if (text.indexOf(this.condition) == text.length - this.condition.length) {
          this.element.classList.add("strikethrough");
          return true;
        }
        break;

      case "contain":
        if (text.indexOf(this.condition) != -1) {
          this.element.classList.add("strikethrough");
          return true;
        }
        break;

      case "minLetterCount":
        let letters = 0;
        for (let char of text) {
          const letter = char.toLowerCase();
          if (letter in playerdata.prices) {
            letters++;
          }
        }

        if (letters >= this.condition) {
          this.element.classList.add("strikethrough");
          return true;
        }
        break;
    }

    return false;
  }
}

class Request {
  constructor(guy, title) {
    this.guy = guy;
    this.title = title || "A PIECE OF WRITING";
    this.rules = [];
    this.accepted = false;
    this.fulfilled = false;
    this.compensation = "...";
  }

  addRule(p) {
    this.rules.push(new RequestRule(p));
  }

  setCompensation(p) {
    this.compensation = {
      type: p.type,
      condition: p.condition
    }
  }

  previewForAcceptance() {
    const dialog = ui.dialogs["preview-request"];

    dialog.querySelector("[name='dialogue']").textContent = "i have a request for you.";

    if (!this.element) {
      this.createElement();
    }

    const request = dialog.querySelector("[name='request']");

    if (request.lastElementChild) {
      request.lastElementChild.remove();
    }

    request.appendChild(this.element);

    const accept = dialog.querySelector("[name='accept']");
    accept.dataset.index = this.guy.index;
    accept.onclick = function() {
      const guy = game.guys[this.dataset.index];
      guy.acceptRequest();
      this.parentNode.parentNode.close();
    };

    dialog.showModal();
  }

  accept() {
    this.accepted = true;

    this.index = playerdata.requests.length;
    playerdata.requests.push(this);

    this.addToWorkshop();
    this.select();
  }

  createElement() {
    this.element = divContainingTemplate("request");

    const title = this.element.querySelector("[name='title']");
    title.textContent = this.title;

    const guy = this.element.querySelector("[name='guy']");
    guy.src = this.guy.imageElement.src;
    guy.alt = this.guy.imageElement.alt;

    const rules = this.element.querySelector("[name='rules']");
    while (rules.lastElementChild) {
      rules.lastElementChild.remove();
    }
    for (let rule of this.rules) {
      const li = document.createElement("li");
      li.appendChild(rule.element);
      rules.appendChild(li);
    }

    const status = this.element.querySelector("[name='status']");

    this.pieceSelectButton = this.element.querySelector("[name='piece-name']");
    this.statusElement = status;

    const comp = this.element.querySelector("[name='compensation']");
    switch (this.compensation.type) {
      case "pointsPerLetter":
        comp.innerHTML = "<span class='burgerpoints' title='BurgerPoints'></span>"+this.compensation.condition+" PER LETTER";
        break;

      case "points":
        comp.innerHTML = "<span class='burgerpoints' title='BurgerPoints'></span>"+this.compensation.condition;
        break;

      case "gift":
        comp.textContent = "A GIFT";
        break;

      case "piece":
        comp.textContent = "A PIECE";
        break;
    }
  }

  addToWorkshop() {
    ui.workshop.requestContainer.appendChild(this.element);
    this.element.classList.add("gone");

    ui.workshop.requestBlock.classList.remove("gone");
  }

  select() {
    const previousRequest = playerdata.requests[playerdata.requestIndex];
    if (previousRequest) {
      previousRequest.deselect();
    }
    playerdata.requestIndex = this.index;
    this.element.classList.remove("gone");
    ui.workshop.requestPieceBlock.classList.add("gone");
    if (this.piece) {
      ui.workshop.requestPiece.textContent = this.piece.text;
      ui.workshop.requestPieceBlock.classList.remove("gone");
    }

    updateRequestContainer();
  }

  deselect() {
    this.element.classList.add("gone");
    ui.workshop.requestPieceListBlock.classList.add("gone");
  }

  applyPiece(piece) {
    for (let rule of this.rules) {
      rule.check(piece ? piece.text : "");
    }

    if (!piece) {
      if (this.piece) {
        const wp = new WorkshopPiece(this.piece.text);
        wp.addToWorkshop();
        this.piece = null;
      }

      this.statusElement.textContent = "UNWRITTEN";
      this.pieceSelectButton.textContent = "SELECT PIECE";
      this.pieceSelectButton.parentNode.removeAttribute("title");
      ui.workshop.requestPieceBlock.classList.add("gone");

      this.guy.element.classList.remove("awaiting-request");
      this.guy.fulfillRequestButton.classList.add("gone");

      return;
    }

    this.guy.element.classList.add("awaiting-request");
    this.guy.fulfillRequestButton.classList.remove("gone");

    this.piece = {
      text: piece.text,
      title: piece.title
    };

    this.pieceSelectButton.parentNode.setAttribute("title", "detach piece");

    this.statusElement.textContent = "UNDELIVERED";

    this.pieceSelectButton.textContent = piece.title;
    piece.inputManager.burn();
    piece.removeFromWorkshop();
    ui.workshop.requestPieceListBlock.classList.add("gone");
    ui.workshop.requestPieceBlock.classList.remove("gone");

    ui.workshop.requestPiece.textContent = this.piece.text;
  }

  fulfill() {
    this.statusElement.textContent = "DELIVERED";
    this.pieceSelectButton.parentNode.setAttribute("disabled", true);
    this.pieceSelectButton.parentNode.removeAttribute("title");
    this.fulfilled = true;

    var allgood = true;
    for (let rule of this.rules) {
      if (!rule.check(this.piece.text)) {
        allgood = false;
      }
    }
    if (allgood) {
      // compensate the player

      switch (this.compensation.type) {
        case "pointsPerLetter":
          let letters = 0;
          for (let char of this.piece.text) {
            const letter = char.toLowerCase();
            if (letter in playerdata.prices) {
              letters++;
            }
          }

          const points = letters * this.compensation.condition;

          for (let i=0; i<points; i++) {
            setTimeout(burgerpointParticle, Math.random() * 100 * points);
          }

          break;

        case "points":
          for (let i=0; i<this.compensation.condition; i++) {
            setTimeout(burgerpointParticle, Math.random() * 100 * this.compensation.condition);
          }
          break;

        case "gift":
          // todo
          break;

        case "piece":
          // todo
          break;
      }
    }
  }
}

function updateRequestPieceList() {
  while (ui.workshop.requestPieceList.lastElementChild) {
    ui.workshop.requestPieceList.lastElementChild.remove();
  }

  let piecesCounted = 0;
  for (let piece of playerdata.workshop) {
    if (piece.lettersCount() != 0) {
      ui.workshop.requestPieceList.appendChild(piece.requestListItem);
      piecesCounted++;
    }
  }

  if (piecesCounted == 0) {
    ui.workshop.requestPieceListBlock.querySelector("[name='request-pieces-none']").classList.remove("gone");
  } else {
    ui.workshop.requestPieceListBlock.querySelector("[name='request-pieces-none']").classList.add("gone");
  }
}

function selectRequestPiece() {
  ui.workshop.requestPieceListBlock.classList.toggle("gone");

  if (!ui.workshop.requestPieceListBlock.classList.contains("gone")) {
    const currentRequest = playerdata.requests[playerdata.requestIndex];

    if (currentRequest) {
      currentRequest.applyPiece();
    }

    updateRequestPieceList();
  }
}

function navigateRequestContainer(value) {
  playerdata.requests[playerdata.requestIndex + value].select();
}

function updateRequestContainer() {
  const buttons = ui.workshop.requestBlock.querySelectorAll("button");

  if (playerdata.requestIndex <= 0) {
    buttons[0].setAttribute("disabled", true);
  } else {
    buttons[0].removeAttribute("disabled");
  }

  ui.workshop.requestsIndex.textContent = playerdata.requestIndex + 1;
  ui.workshop.requestsTotal.textContent = playerdata.requests.length;

  if (playerdata.requestIndex >= playerdata.requests.length - 1) {
    buttons[1].setAttribute("disabled", true);
  } else {
    buttons[1].removeAttribute("disabled");
  }
}
