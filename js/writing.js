class Piece {
  constructor(text) {
    text = text || "";
    this.history = [];
    this.historyIndex = -1;
    this.disintegrated = false;
    this.update(text, text.length - 1, text.length - 1, "", "");
  }

  update(text, selectionStart, selectionEnd, added, deleted) {
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    this.history.push({
      text: text,
      selectionStart: selectionStart,
      selectionEnd: selectionEnd,
      added: added,
      deleted: deleted
    });
    this.historyIndex = this.history.length - 1;

    this.updateState();
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
    let abcs = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let letters = 0;
    for (let char of this.text) {
      if (abcs.includes(char)) {
        letters++;
      }
    }
    return letters;
  }

  hasUndo() {
    return this.historyIndex > 0;
  }

  hasRedo() {
    return this.historyIndex < this.history.length - 1;
  }

  clear() {
    let abcs = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let deleting = "";
    for (let char of this.text) {
      if (abcs.includes(char)) {
        unuse_letter(char.toLowerCase());
        deleting += char.toLowerCase();
      }
    }

    this.update("", 0, 0, "", deleting);
    this.displayInWorkshopTextarea();
  }

  undo() {
    if (this.historyIndex <= 0) return;

    const state = this.history[this.historyIndex];
    const deleted = state.deleted;
    const added = state.added;
    for (let char of deleted) {
      playerdata.letters[char]--;
    }
    for (let char of added) {
      playerdata.letters[char]++;
    }
    updateList(ui.workshop.lettersList, playerdata.letters);

    this.historyIndex--;
    this.updateState();
    this.displayInWorkshopTextarea();
  }

  redo() {
    if (this.historyIndex == this.history.length - 1) return;

    this.historyIndex++;
    this.updateState();

    const state = this.history[this.historyIndex];
    const deleted = state.deleted;
    const added = state.added;
    for (let char of deleted) {
      playerdata.letters[char]++;
    }
    for (let char of added) {
      playerdata.letters[char]--;
    }
    updateList(ui.workshop.lettersList, playerdata.letters);
    this.displayInWorkshopTextarea();
  }

  updateState() {
    const workshop = ui.workshop.textarea;
    const state = this.history[this.historyIndex];
    this.text = state.text;
    workshop.selectionStart = state.selectionStart;
    workshop.selectionEnd = state.selectionEnd;

    const title = this.text.split("\n")[0];
    this.title = title == "" ? "Empty note" : title;

    const lib = ui.workshop.library;
    if (
      playerdata.workshopIndex != -1 && playerdata.workshopIndex < lib.children.length &&
      playerdata.workshop[playerdata.workshopIndex] == this
    )
      lib.children[playerdata.workshopIndex].textContent = this.title;
  }

  displayInWorkshopTextarea() {
    const state = this.history[this.historyIndex];
    const workshop = ui.workshop.textarea;

    workshop.value = state.text;
  }

  addToLibrary() {
    playerdata.libraryIndex = playerdata.library.length;
    playerdata.library.push(this);
    updateBookshelf();
    selectBook(ui.kitchen.bookshelf.lastElementChild, playerdata.libraryIndex);
  }

  disintegrate() {
    this.disintegrateFrame();
    if (!this.disintegrating) {
      this.disintegrating = true;
      this.sfxId = sfx("disintegrate");
    }

    sfx('click');
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
        updateList(ui.kitchen.lettersList, playerdata.letters);
        updateList(ui.workshop.lettersList, playerdata.letters);
      }
      setObjectTimeout(this, "disintegrateFrame", 2);
    } else {
      if (!this.disintegrated) {
        playerdata.library.splice(playerdata.library.indexOf(this), 1);
        updateBookshelf();
        navigateLibrary(0);
        sfx_stop("disintegrate", null, this.sfxId);
      }
      this.disintegrated = true;
    }
    updateLibrary();
  }
}

class PieceAlert {
  constructor(text, cost) {
    game.market.push(text);

    let div = divContainingTemplate("template-writing-alert");
    cost = cost || 0;
    div.dataset.title = text.split("\n")[0];
    div.className = "block transparent";

    let readbutton = div.querySelectorAll("button")[0];
    readbutton.dataset.text = text;
    readbutton.dataset.title = div.dataset.title;
    readbutton.onclick = function() {
      ui.dialogs["read-text-title"].textContent = this.dataset.title;
      ui.dialogs["read-text-content"].textContent = this.dataset.text;
      ui.dialogs["read-text"].showModal();
    }

    let savebutton = div.querySelectorAll("button")[1];
    savebutton.dataset.text = text;
    savebutton.dataset.cost = cost;
    savebutton.onclick = function() {
      const p = this.parentNode.parentNode.parentNode;
      const cost = Number(this.dataset.cost);

      if (playerdata.points < cost) {
        sfx("error");
        ui.dialogs["no-points"].showModal();
        return;
      }

      bankPoints(-cost, "WWW");

      const piece = new Piece(this.dataset.text);
      game.market.splice(game.market.indexOf(this.dataset.text), 1);
      piece.addToLibrary();
      sfx('click');

      p.classList.add("send-library");
      p.onanimationend = function() {
        console.log(this);
        this.remove();
        if (ui.workshop.market.lastElementChild == ui.workshop.marketEmptyMessage) {
          ui.workshop.marketEmptyMessage.classList.remove("gone");
        }
      }

      this.onclick = null;
    }

    div.querySelector("[name='title']").textContent = div.dataset.title;
    if (cost == 0) {
      div.querySelector("[name='nonzerocost']").remove();
    } else {
      div.querySelector("[name='cost']").textContent = cost;
    }

    ui.workshop.market.appendChild(div);
    ui.workshop.marketEmptyMessage.classList.add("gone");
  }
}

function use_letter(letter) {
  let count = playerdata.letters[letter];
  if (count > 0) {
    playerdata.letters[letter]--;
    updateList(ui.kitchen.lettersList, playerdata.letters);
    updateList(ui.workshop.lettersList, playerdata.letters);
    return letter;
  } else {
    return false;
  }
}
function unuse_letter(letter) {
  if (!(letter in playerdata.letters)) {
    playerdata.letters[letter] = 0;
  }
  playerdata.letters[letter]++;
  updateList(ui.kitchen.lettersList, playerdata.letters);
  updateList(ui.workshop.lettersList, playerdata.letters);
}

function update_workshop() {
  const workshop = ui.workshop.textarea;
  let abcs = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

  const piece = playerdata.workshop[playerdata.workshopIndex];
  const prevState = piece.history[piece.historyIndex];

  let prevtext = prevState.text;
  let text = workshop.value;

  let added, deleted;
  let addedIndex = prevState.selectionStart;
  let deletedIndex = prevState.selectionEnd;
  let selWidth = prevState.selectionEnd - prevState.selectionStart;
  let caretPosition = workshop.selectionStart;
  let letterRejected = false;

  if (selWidth > 0) {
    deleted = prevtext.substring(addedIndex, deletedIndex);
  } else {
    deleted = prevtext;
    for (let char of text) {
      deleted = deleted.replace(char, "");
    }
  }

  added = text;
  let tempPrev = prevtext;
  if (selWidth > 0) {
    tempPrev = prevtext.substring(0, addedIndex) + prevtext.substring(deletedIndex);
  }
  for (let char of tempPrev) {
    added = added.replace(char, "");
  }

  // console.log("added: "+added+" \nindex: "+addedIndex+"\ndeleted: "+deleted+"\nindex: "+deletedIndex+"\ncaret: "+caretPosition);

  let output = prevtext;
  let charsDeleted = "";
  for (let char of deleted) {
    if (abcs.includes(char)) {
      unuse_letter(char.toLowerCase());
      charsDeleted += char.toLowerCase();
    }
  }
  if (selWidth == 0) {
    output = output.substring(0, caretPosition) + output.substring(deletedIndex);
  } else {
    output = output.substring(0, addedIndex) + output.substring(deletedIndex);
  }

  let addable = "";
  let charsAdded = "";
  if (added) {
    for (let char of added) {
      if (abcs.includes(char)) {
        let letter = use_letter(char.toLowerCase());
        if (letter) {
          addable += char;
          charsAdded += letter;
        } else {
          letterRejected = true;
        }
      } else {
        addable += char;
      }
    }

    if (selWidth == 0) {
      output = output.substring(0, addedIndex) + addable + output.substring(addedIndex + 1);
    } else {
      output = output.substring(0, addedIndex) + addable + output.substring(addedIndex);
    }

    if (letterRejected) {
      workshop.classList.remove("rejected");
      workshop.classList.add("rejected");
      workshop.dataset.caretIndex = addedIndex;
      setTimeout(function() {
        const piece = playerdata.workshop[playerdata.workshopIndex];
        const currentState = piece.history[piece.history.length - 1];
        const workshop = ui.workshop.textarea;
        workshop.selectionStart = workshop.selectionEnd =
        currentState.selectionStart = currentState.selectionEnd =
          Number(workshop.dataset.caretIndex);
      }, 0);
      workshop.onanimationend = function() {
        this.classList.remove("rejected");
      }
    }
  }

  workshop.value = output;

  if (output != prevtext) {
    piece.update(output, workshop.selectionStart, workshop.selectionEnd, charsAdded, charsDeleted);
    piece.displayInWorkshopTextarea();

    sfx("type");
  } else if (letterRejected) {
    sfx("error");
  }
}

function init_workshop() {
  const workshop = ui.workshop.textarea;

  workshop.addEventListener("focus", function() {
    const button = ui.workshop.library.children[playerdata.workshopIndex];
    button.classList.remove("focused");
  });
  workshop.addEventListener("blur", function() {
    const button = ui.workshop.library.children[playerdata.workshopIndex];
    button.classList.add("focused");
  });
  document.addEventListener("selectionchange", function(e) {
    const workshop = ui.workshop.textarea;
    if (e.target.activeElement != workshop) return;

    const piece = playerdata.workshop[playerdata.workshopIndex];
    const currentState = piece.history[piece.history.length - 1];
    currentState.selectionStart = workshop.selectionStart;
    currentState.selectionEnd = workshop.selectionEnd;
  });

  workshop.addEventListener("input", update_workshop);
}

function addPieceToWorkshop() {
  deselectWorkshopLibraryButton();
  playerdata.workshopIndex = playerdata.workshop.length;
  playerdata.workshop.push(new Piece());
  createWorkshopLibraryButton(playerdata.workshopIndex);

  const piece = playerdata.workshop[playerdata.workshopIndex];
  piece.displayInWorkshopTextarea();
}

function removePieceFromWorkshop() {
  for (let char of playerdata.workshop[playerdata.workshopIndex].text) {
    unuse_letter(char);
  }

  playerdata.workshop.splice(playerdata.workshopIndex, 1);
  const lib = ui.workshop.library;
  for (let i=lib.children.length - 1; i>=0; i--) {
    if (i > playerdata.workshopIndex) {
      lib.children[i].dataset.index = i-1;
    } else if (i == playerdata.workshopIndex) {
      lib.children[i].remove();
      break;
    }
  }
  if (playerdata.workshopIndex >= playerdata.workshop.length) playerdata.workshopIndex--;
  if (playerdata.workshop.length <= 0) {
    addPieceToWorkshop();
  } else {
    lib.children[playerdata.workshopIndex].classList.add("selected");
    lib.children[playerdata.workshopIndex].classList.add("focused");
  }

  const piece = playerdata.workshop[playerdata.workshopIndex];
  ui.workshop.textarea.value = piece.text;
}
