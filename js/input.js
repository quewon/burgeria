var _inputs = [];

document.onselectionchange = function(e) {
  for (let manager of _inputs) {
    if (e.target.activeElement != manager.element) continue;
    manager.selectionchange();
  }
}

class InputState {
  constructor(text, selectionStart, selectionEnd, addedText, deletedText) {
    this.text = text || "";
    this.selectionStart = selectionStart || 0;
    this.selectionEnd = selectionEnd || 0;
    this.addedText = addedText || "";
    this.deletedText = deletedText || "";
  }
}

class InputManager {
  constructor(inputElement, text, oninput) {
    this.element = inputElement;
    if (oninput) this.oninput = oninput;
    this.index = _inputs.length;
    _inputs.push(this);

    this.history = [];
    this.historyIndex = -1;
    this.locked = false;
    this.newState(text, text ? text.length - 1 : null, text ? text.length - 1 : null);

    this.element.dataset.index = this.index;
    this.element.oninput = function() {
      this.input();
    }.bind(this);
  }

  newState(text, selectionStart, selectionEnd, added, deleted) {
    if (this.locked) return;
    if (this.history.length > 0) {
      if (this.history[this.historyIndex].text == text) return;
    }

    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    this.history.push(new InputState(text, selectionStart, selectionEnd, added, deleted));
    this.historyIndex = this.history.length - 1;
  }

  selectionchange() {
    if (this.history.length == 0) return;

    this.history[this.historyIndex].selectionStart = this.element.selectionStart;
    this.history[this.historyIndex].selectionEnd = this.element.selectionEnd;
  }

  useLetter(letter) {
    if (!(letter in LETTERS)) return;

    let count = playerdata.letters[letter];
    if (count > 0) {
      playerdata.letters[letter]--;
      updateLettersLists();
      return letter;
    } else {
      return false;
    }
  }

  unuseLetter(letter) {
    if (!(letter in LETTERS)) return;

    playerdata.letters[letter]++;
    updateLettersLists();
  }

  input() {
    const prevState = this.history[this.historyIndex];
    const element = this.element;

    if (this.locked) {
      element.value = prevState.text;
      return;
    }

    let prevtext = prevState.text;
    let text = element.value;

    let added, deleted;
    let addedIndex = prevState.selectionStart;
    let deletedIndex = prevState.selectionEnd;
    let selWidth = prevState.selectionEnd - prevState.selectionStart;
    let caretPosition = element.selectionStart;
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
      const letter = char.toLowerCase();
      if (letter in LETTERS) {
        this.unuseLetter(letter);
        charsDeleted += letter;
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
        const letter = char.toLowerCase();
        if (letter in LETTERS) {
          const result = this.useLetter(letter);
          if (result) {
            addable += char;
            charsAdded += result;
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
        element.classList.remove("rejected");
        element.classList.add("rejected");
        element.dataset.caretIndex = addedIndex;
        setObjectTimeout(this, "updateCaret", 0);
        element.onanimationend = function() {
          this.classList.remove("rejected");
        }
      }
    }

    output = output.replace(/[^\x00-\x7F]/g, "");

    element.value = output;

    if (output != prevtext) {
      this.newState(output, element.selectionStart, element.selectionEnd, charsAdded, charsDeleted);
      if (this.oninput) this.oninput();

      sfx("type");
    } else if (letterRejected) {
      sfx("error");
    }
  }

  updateCaret() {
    const currentState = this.history[this.historyIndex];
    this.element.selectionStart = this.element.selectionEnd =
    currentState.selectionStart = currentState.selectionEnd =
      Number(this.element.dataset.caretIndex);
  }

  clear() {
    if (this.locked) return;

    const state = this.history[this.historyIndex];

    let deleting = "";
    for (let char of state.text) {
      const letter = char.toLowerCase();
      if (letter in playerdata.prices) {
        this.unuseLetter(letter);
        deleting += letter;
      }
    }

    this.newState("", 0, 0, "", deleting);
    if (this.oninput) this.oninput();
  }

  hasUndo() {
    return this.historyIndex > 0;
  }

  hasRedo() {
    return this.historyIndex < this.history.length - 1;
  }

  undo() {
    if (this.locked) return;
    if (this.historyIndex <= 0) return;

    const state = this.history[this.historyIndex];
    const deleted = state.deletedText;
    const added = state.addedText;
    for (let char of deleted) {
      playerdata.letters[char]--;
    }
    for (let char of added) {
      playerdata.letters[char]++;
    }
    updateLettersLists();

    this.historyIndex--;
    if (this.oninput) this.oninput();
  }

  redo() {
    if (this.locked) return;
    if (this.historyIndex == this.history.length - 1) return;

    this.historyIndex++;
    if (this.oninput) this.oninput();

    const state = this.history[this.historyIndex];
    const deleted = state.deletedText;
    const added = state.addedText;
    for (let char of deleted) {
      playerdata.letters[char]++;
    }
    for (let char of added) {
      playerdata.letters[char]--;
    }
    updateLettersLists();
  }

  burn() {
    this.history = [];
    this.newState();
    if (this.oninput) this.oninput();
  }

  delete() {
    this.clear();

    spliceIndexedObject(_inputs, this.index, function(manager) {
      manager.element.dataset.index = manager.index;
    });
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
}

function updateLettersLists() {
  updateList(ui.kitchen.lettersList, playerdata.letters);
  updateList(ui.workshop.lettersList, playerdata.letters);
  updateList(ui.storefront.lettersList, playerdata.letters);
  updateList(ui.kitchen.researchLettersList, playerdata.letters);
}
