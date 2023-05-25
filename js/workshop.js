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

class WorkshopPiece {
  constructor(text) {
    text = text || "";

    this.history = [];
    this.historyIndex = -1;
    this.update(text, text.length - 1, text.length - 1, "", "");

    this.locked = false;
  }

  update(text, selectionStart, selectionEnd, added, deleted) {
    if (this.locked) return;

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

    this.updateUI();
  }

  updateUI() {
    if (this.locked) return;

    const workshop = ui.workshop.textarea;
    const state = this.history[this.historyIndex];
    workshop.selectionStart = state.selectionStart;
    workshop.selectionEnd = state.selectionEnd;
    workshop.value = state.text;

    this.text = state.text;
    const title = this.text.split("\n")[0];
    this.title = title == "" ? "Empty note" : title;

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
    if (this.locked) return;

    let abcs = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let deleting = "";
    for (let char of this.text) {
      const letter = char.toLowerCase();
      if (letter in playerdata.values) {
        unuse_letter(letter);
        deleting += letter;
      }
    }

    this.update("", 0, 0, "", deleting);
  }

  undo() {
    if (this.locked) return;
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
    this.updateUI();
  }

  redo() {
    if (this.locked) return;
    if (this.historyIndex == this.history.length - 1) return;

    this.historyIndex++;
    this.updateUI();

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
  }

  attemptPublish() {
    if (this.locked) return;

    if (this.lettersCount() == 0) {
      console.log("tried to publish a piece without letters.");
      ui.dialogs["publishing-error-no-letters"].showModal();
      return;
    }

    write_data(this);

    sfx("click");

    this.locked = true;
  }

  publishFailed() {
    this.locked = false;
  }

  publishSucceeded() {
    this.locked = false;

    ui.dialogs["publishing-success-content"].textContent = this.text;
    if (ui.dialogs["publishing-success"].getAttribute("open") == null) {
      ui.dialogs["publishing-success"].showModal();
    }

    sellText(this.text);

    this.history = [];
    this.update("", 0, 0, "", "");
    this.removeFromWorkshop();
    let dropdownAnchors = document.getElementsByClassName("dropdown-anchor");
    for (let anchor of dropdownAnchors) {
      anchor.classList.remove("activated");
    }
  }

  releaseToWind() {
    if (this.locked) return;

    if (this.lettersCount() == 0) {
      console.log("tried to publish a piece without letters.");
      ui.dialogs["publishing-error-no-letters"].showModal();
      return;
    }

    ui.dialogs["wind-content"].textContent = this.text;
    ui.dialogs["wind"].showModal();
    sfx("click");

    sellText(this.text);

    this.history = [];
    this.update("", 0, 0, "", "");
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
    for (let char of this.text) {
      const letter = char.toLowerCase();
      if (letter in playerdata.prices) {
        unuse_letter(letter);
      }
    }

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
    let dropdownAnchors = document.getElementsByClassName("dropdown-anchor");
    for (let anchor of dropdownAnchors) {
      anchor.classList.remove("activated");
    }

    const prevPiece = playerdata.workshop[playerdata.workshopIndex];
    if (prevPiece) prevPiece.buttonDeselect();

    playerdata.workshopIndex = this.index;
    this.element.classList.add("selected");
    this.element.classList.add("focused");
    this.element.setAttribute("disabled", true);
    ui.workshop.textarea.value = playerdata.workshop[playerdata.workshopIndex].text;
  }

  buttonDeselect() {
    this.element.classList.remove("selected");
    this.element.classList.remove("focused");
    this.element.removeAttribute("disabled");
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
  const piece = playerdata.workshop[playerdata.workshopIndex];
  const prevState = piece.history[piece.historyIndex];
  const workshop = ui.workshop.textarea;

  if (piece.locked) {
    workshop.value = prevState.text;
    return;
  }

  const abcs = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

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

function createWorkshopPiece() {
  const piece = new WorkshopPiece();
  piece.addToWorkshop();
  sfx('click');
}

function deleteWorkshopPiece() {
  playerdata.workshop[playerdata.workshopIndex].removeFromWorkshop();
  sfx('click');
}
