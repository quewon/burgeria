class RequestRule {
  constructor() {
    this.text = "undefined rule";
  }
}

class Request {
  constructor(guy, title) {
    this.guy = guy;
    this.title = title || "A PIECE OF WRITING";
    this.rules = [];
    this.accepted = false;
    this.compensation = "...";
  }

  addRule() {
    this.rules.push(new RequestRule(

    ));
  }

  previewForAcceptance() {
    const dialog = ui.dialogs["preview-request"];

    dialog.querySelector("[name='dialogue']").textContent = "i have a request for you.";

    if (!this.element) {
      this.createElement();
    }

    //<li>must contain the word <span class="monospace"><em>MOTHER</em></span>.</li>
    //<li>must be <em>30 characters or longer</em>.</li>

    const request = dialog.querySelector("[name='request']");
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
      li.innerHTML = rule.html;
      rules.appendChild(li);
    }

    const status = this.element.querySelector("[name='status']");

    this.pieceSelectButton = this.element.querySelector("[name='piece-name']");
    this.statusElement = status;
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
      return;
    }

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
