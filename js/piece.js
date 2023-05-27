function calculatePieceCost(text) {
  var cost = 0;
  for (let char of text) {
    if (char in playerdata.prices) {
      const prices = playerdata.prices[char];
      cost += prices[prices.length - 1];
    }
  }
  return Math.ceil(cost);
}

class PieceAlert {
  constructor(text, cost) {
    text = text || "";
    cost = cost || calculatePieceCost(text);
    this.text = text;
    this.cost = cost;
    this.title = text.split("\n")[0];
    this.index = game.market.length;

    game.market.push(this);

    // create domelement

    let div = divContainingTemplate("writing-alert");
    div.className = "block transparent";

    let readbutton = div.querySelectorAll("button")[0];
    readbutton.dataset.index = this.index;
    readbutton.onclick = function() {
      const piece = game.market[this.dataset.index];
      ui.dialogs["read-text-title"].textContent = piece.title;
      ui.dialogs["read-text-content"].textContent = piece.text;
      ui.dialogs["read-text"].showModal();
    }

    let savebutton = div.querySelectorAll("button")[1];
    savebutton.dataset.index = this.index;
    savebutton.onclick = function() {
      const piece = game.market[this.dataset.index];
      piece.addToLibrary();
    }

    div.querySelector("[name='title']").textContent = this.title;
    if (this.cost == 0) {
      div.querySelector("[name='nonzerocost']").remove();
    } else {
      div.querySelector("[name='cost']").textContent = cost;
    }

    ui.workshop.market.appendChild(div);
    ui.workshop.marketEmptyMessage.classList.add("gone");

    this.element = div;
    this.savebutton = savebutton;
    this.readbutton = readbutton;
  }

  addToLibrary() {
    if (playerdata.points < this.cost) {
      sfx("error");
      ui.dialogs["no-points"].showModal();
      return;
    }

    bankPoints(-this.cost, "WWW");
    buyText(this.text);

    spliceIndexedObject(game.market, this.index, function(piece) {
      piece.savebutton.dataset.index = piece.index;
      piece.readbutton.dataset.index = piece.index;
    });

    new LibraryPiece(this.text);

    sfx('click');

    this.element.classList.add("send-library");
    this.element.onanimationend = function() {
      this.remove();
      if (ui.workshop.market.lastElementChild == ui.workshop.marketEmptyMessage) {
        ui.workshop.marketEmptyMessage.classList.remove("gone");
      }
    }
    this.savebutton.setAttribute("disabled", true);
  }
}

class LibraryPiece {
  constructor(text) {
    this.text = text || "";
    this.title = text.split("\n")[0];
    this.disintegrated = false;

    // add to library

    this.index = playerdata.library.length;
    playerdata.libraryIndex = this.index;
    playerdata.library.push(this);

    this.createKitchenBook();

    updateBookshelf();
    selectBook(ui.kitchen.bookshelf.lastElementChild, this.index);
  }

  createKitchenBook() {
    var book = document.createElement("button");
    book.classList.add("book");
    book.setAttribute("type", "book");
    book.dataset.index = this.index;
    book.onclick = function() {
      selectBook(this, Number(this.dataset.index));
    };

    createBookLabel(book, this.title);

    this.element = book;
  }

  removeFromLibrary() {
    spliceIndexedObject(playerdata.library, this.index);
    updateBookshelf(true);
    navigateLibrary(0);
  }

  disintegrate() {
    this.disintegrateFrame();
    if (!this.disintegrating) {
      this.disintegrating = true;
      this.sfxId = sfx("disintegrate");
    }
  }

  disintegrateFrame() {
    if (/[a-zA-Z]/.test(this.text)) {
      let randomindex = Math.random() * this.text.length | 0;
      while (this.text[randomindex] == " ") {
        randomindex--;
        if (randomindex < 0) randomindex = this.text.length - 1;
      }
      let char = this.text[randomindex];
      this.text = this.text.slice(0, randomindex) + " " + this.text.slice(randomindex + 1);
      if ("abcdefghijklmnopqrstuvwxyz".includes(char)) {
        if (!(char in playerdata.letters)) {
          playerdata.letters[char] = 0;
        }
        playerdata.letters[char]++;
        updateLettersLists();
      }
      setObjectTimeout(this, "disintegrateFrame", 2);
    } else {
      if (!this.disintegrated) {
        this.removeFromLibrary();
        sfx_stop("disintegrate", null, this.sfxId);
      }
      this.disintegrated = true;
    }
    updateLibrary();
  }
}

class WorkshopPiece {
  constructor(text) {
    text = text || "";

    this.inputManager = new InputManager(ui.workshop.textarea, text, function() {
      this.piece.text = this.history[this.historyIndex].text;
      const title = this.piece.text.split("\n")[0];
      this.piece.title = title == "" ? "Empty note" : title;
      this.piece.updateUI();
    });
    this.inputManager.piece = this;
    this.inputManager.oninput();
  }

  updateUI() {
    const workshop = ui.workshop.textarea;
    const state = this.inputManager.history[this.inputManager.historyIndex];
    workshop.selectionStart = state.selectionStart;
    workshop.selectionEnd = state.selectionEnd;
    workshop.value = state.text;

    const lib = ui.workshop.library;
    if (
      playerdata.workshopIndex != -1 && playerdata.workshopIndex < lib.children.length &&
      playerdata.workshop[playerdata.workshopIndex] == this
    )
      lib.children[playerdata.workshopIndex].textContent = this.title;
  }

  wordsCount() {
    let words = 0;
    let array = this.text.split(" ");
    for (let potentialWord of array) {
      if (/[a-zA-Z]/g.test(potentialWord)) {
        words++;
      }
    }
    return words;
  }

  lettersCount() {
    let letters = 0;
    for (let char of this.text) {
      const letter = char.toLowerCase();
      if (letter in playerdata.prices) {
        letters++;
      }
    }
    return letters;
  }

  attemptPublish() {
    if (this.inputManager.locked) return;

    if (this.lettersCount() == 0) {
      console.log("tried to publish a piece without letters.");
      ui.dialogs["publishing-error-no-letters"].showModal();
      return;
    }

    write_data(this);

    sfx("click");

    this.inputManager.locked = true;
  }

  publishFailed() {
    this.inputManager.locked = false;
  }

  publishSucceeded() {
    this.inputManager.locked = false;

    ui.dialogs["publishing-success-content"].textContent = this.text;
    if (ui.dialogs["publishing-success"].getAttribute("open") == null) {
      ui.dialogs["publishing-success"].showModal();
    }

    sellText(this.text);

    this.removeFromWorkshop();
    let dropdownAnchors = document.getElementsByClassName("dropdown-anchor");
    for (let anchor of dropdownAnchors) {
      anchor.classList.remove("activated");
    }
  }

  releaseToWind() {
    if (this.inputManager.locked) return;

    if (this.lettersCount() == 0) {
      console.log("tried to publish a piece without letters.");
      ui.dialogs["publishing-error-no-letters"].showModal();
      return;
    }

    ui.dialogs["wind-content"].textContent = this.text;
    ui.dialogs["wind"].showModal();
    sfx("click");

    sellText(this.text);

    this.removeFromWorkshop();
    let dropdownAnchors = document.getElementsByClassName("dropdown-anchor");
    for (let anchor of dropdownAnchors) {
      anchor.classList.remove("activated");
    }
  }

  addToWorkshop() {
    this.index = playerdata.workshop.length;
    playerdata.workshop.push(this);

    const lib = ui.workshop.library;
    const pieces = playerdata.workshop;

    let button = document.createElement("button");
    button.textContent = this.title;
    button.dataset.index = this.index;
    button.onclick = function() {
      playerdata.workshop[this.dataset.index].buttonSelect();
    }
    lib.appendChild(button);
    this.element = button;

    this.buttonSelect();
  }

  removeFromWorkshop() {
    this.inputManager.delete();

    spliceIndexedObject(playerdata.workshop, this.index, function(obj) {
      obj.element.dataset.index = obj.index;
    });

    if (playerdata.workshopIndex >= playerdata.workshop.length) playerdata.workshopIndex--;
    if (playerdata.workshop.length <= 0) {
      const piece = new WorkshopPiece();
      piece.addToWorkshop();
    } else {
      const lib = ui.workshop.library;
      lib.children[playerdata.workshopIndex].classList.add("selected");
      lib.children[playerdata.workshopIndex].classList.add("focused");
    }

    const piece = playerdata.workshop[playerdata.workshopIndex];
    ui.workshop.textarea.value = piece.text;

    piece.buttonSelect();

    this.element.remove();
  }

  updateCountUI() {
    const words = ui.workshop.wordsCount;
    const letters = ui.workshop.lettersCount;
    words.textContent = this.wordsCount();
    letters.textContent = this.lettersCount();
  }

  buttonSelect() {
    if (ui.currentScene == "workshop") {
      let dropdownAnchors = document.getElementsByClassName("dropdown-anchor");
      for (let anchor of dropdownAnchors) {
        anchor.classList.remove("activated");
      }
    }

    const prevPiece = playerdata.workshop[playerdata.workshopIndex];
    if (prevPiece) prevPiece.buttonDeselect();

    playerdata.workshopIndex = this.index;
    this.element.classList.add("selected");
    this.element.classList.add("focused");
    this.element.setAttribute("disabled", true);
    ui.workshop.textarea.value = playerdata.workshop[playerdata.workshopIndex].text;

    this.inputManager.element.dataset.index = this.inputManager.index;
  }

  buttonDeselect() {
    this.element.classList.remove("selected");
    this.element.classList.remove("focused");
    this.element.removeAttribute("disabled");
  }
}

const facadePieceResizeObserver = new ResizeObserver(function(mutations) {
  for (let mutation of mutations) {
    const piece = playerdata.facade[mutation.target.dataset.index];
    if (piece) piece.resize();
  }
});

class FacadePiece {
  constructor(text, origin) {
    this.text = text || "";
    this.index = playerdata.facade.length;
    this.origin = origin || "workshop";
    this.originScene = this.origin == "workshop" ? "workshop" : "kitchen";
    playerdata.facade.push(this);

    this.createElement();
    this.move(Math.random() * 50 + 20, Math.random() * 25 + 10);
    this.drop();
  }

  createElement() {
    var div = divContainingTemplate("facade-piece");

    var block = div.firstElementChild;
    block.dataset.index = this.index;
    block.addEventListener("mousedown", function(e) {
      playerdata.facade[this.dataset.index].drag();
    });

    let returnbutton = div.querySelector("[name='return']");
    returnbutton.title = "return to "+this.origin;
    returnbutton.dataset.index = this.index;
    returnbutton.onmousedown = function(e) {
      e.stopPropagation();
    }
    returnbutton.onclick = function() {
      playerdata.facade[this.dataset.index].returnToOrigin();
    }

    let ghost = document.createElement("div");
    ghost.className = "block facadepiece ghost front";
    ui.facade.pieceContainer.appendChild(ghost);

    div.querySelector("p").textContent = this.text;

    facadePieceResizeObserver.observe(block, { attributes: true });

    ui.facade.pieceContainer.appendChild(div);

    this.element = div;
    this.block = block;
    this.ghost = ghost;
    this.returnbutton = returnbutton;
  }

  resize() {
    this.ghost.style.width = this.block.style.width;
    this.ghost.style.height = this.block.style.height;
    this.drop(true);
  }

  returnToOrigin() {
    spliceIndexedObject(playerdata.facade, this.index, function(piece) {
      piece.block.dataset.index = piece.index;
      piece.returnbutton.dataset.index = piece.index;
    });

    this.block.dataset.index = -1;
    this.element.remove();

    switch (this.origin) {
      case "workshop":
        const piece = new WorkshopPiece(this.text);
        piece.addToWorkshop();
        break;
      case "library":
        new LibraryPiece(this.text);
        break;
    }

    var message = document.createElement("div");
    message.className = "block temp";
    var closebutton = document.createElement("button");
    closebutton.className = "top right front";
    closebutton.textContent = "x";
    closebutton.onclick = function() { this.parentNode.remove() };
    message.innerHTML = "<i>This piece has been returned to the <button onclick='setScene(`"+this.originScene+"`)'>→ "+this.origin+"</button>.</i>";
    message.style.position = "absolute";
    message.style.top = this.y+"%";
    message.style.left = this.x+"%";
    message.style.paddingRight = "calc(1.5rem + var(--padding))";
    message.appendChild(closebutton);
    ui.facade.pieceContainer.appendChild(message);

    updateFacadeList();
  }

  drag() {
    _dragdrop.facadePieceInHand = playerdata.facade[this.index];
    document.documentElement.classList.add("grabbing");

    this.block.classList.add("dragging");
    this.ghost.classList.remove("gone");

    this.offset = {
      x: this.x - _dragdrop.mouse.xp,
      y: this.y - _dragdrop.mouse.yp
    };
  }

  move(x, y) {
    this.x = x;
    this.y = y;
    this.ghost.style.left = x+"%";
    this.ghost.style.top = y+"%";
  }

  moveToMouse() {
    this.move(_dragdrop.mouse.xp + this.offset.x, _dragdrop.mouse.yp + this.offset.y);
  }

  drop(dontRestack) {
    _dragdrop.facadePieceInHand = null;
    this.block.classList.remove("dragging");
    document.documentElement.classList.remove("grabbing");
    this.block.style.left = this.ghost.style.left;
    this.block.style.top = this.ghost.style.top;
    this.ghost.classList.add("gone");

    if (!dontRestack) ui.facade.pieceContainer.appendChild(this.element);
  }
}
