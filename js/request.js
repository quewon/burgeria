class RequestRequirement {
  constructor() {

  }
}

class Request {
  constructor() {
    this.guy = new Guy();
    this.title = "haha";
    this.requirements = [];

    this.createElement();

    this.index = playerdata.requests.length;
    playerdata.requests.push(this);

    this.select();
  }

  addRequirement() {
    this.requirements.push(new RequestRequirement(

    ));
  }

  createElement() {
    this.element = divContainingTemplate("request");

    const title = this.element.querySelector("[name='title']");
    title.textContent = this.title;

    const guy = this.element.querySelector("[name='guy']");
    guy.textContent = this.guy.name;

    const requirements = this.element.querySelector("[name='requirements']");
    const status = this.element.querySelector("[name='status']");

    ui.workshop.requestContainer.appendChild(this.element);
    this.element.classList.add("gone");

    this.pieceSelectButton = this.element.querySelector("[name='piece-name']");
    this.statusElement = status;

    ui.workshop.requestBlock.classList.remove("gone");
  }

  select() {
    const previousRequest = playerdata.requests[playerdata.requestIndex];
    if (previousRequest) {
      previousRequest.deselect();
    }
    playerdata.requestIndex = this.index;
    this.element.classList.remove("gone");
    if (this.piece) {
      ui.workshop.requestPiece.textContent = this.piece.text;
      ui.workshop.requestPieceBlock.classList.remove("gone");
    } else {
      ui.workshop.requestPieceBlock.classList.add("gone");
    }

    updateRequestContainer();
  }

  deselect() {
    this.element.classList.add("gone");
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

    this.piece = new WorkshopPiece(piece.text);

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
    ui.workshop.requestPieceList.innerHTML = "<i>You don't have any pieces that contain letters.</i>";
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
