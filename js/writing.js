class Piece {
  constructor(text) {
    this.title = text.split("\n")[0];
    this.text = text;
    this.disintegrated = false;
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

    if (!playerdata.tutorial["letterstock"]) {
      ui.tutorial["letterstock"].classList.remove("gone");
      playerdata.tutorial["letterstock"] = true;
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
    this.title = text.split("\n")[0];

    let div = divContainingTemplate("template-writing-alert");
    cost = cost || 0;
    div.dataset.title = this.title;
    div.dataset.text = text;
    div.dataset.cost = cost;

    let readbutton = div.querySelectorAll("button")[0];
    readbutton.onclick = function() {
      const p = this.parentNode.parentNode;
      const text = p.dataset.text;
      sfx("click");
      alert(text);
    }

    let savebutton = div.querySelectorAll("button")[1];
    savebutton.onclick = function() {
      const p = this.parentNode.parentNode;
      const c = Number(p.dataset.cost);

      if (playerdata.points < c) {
        alert("Not enough points!");
        return;
      }

      bankPoints(-c, "WWW");

      new Piece(p.dataset.text);
      sfx('click');

      p.classList.add("send-library");
      p.onanimationend = function() {
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

function init_workshop() {
  const workshop = ui.workshop.textarea;

  function update_workshop(e) {
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

    let abcs = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

    let prevtext = playerdata.workshop;
    let text = this.value;

    let added, deleted;
    let addedIndex, deletedIndex;
    let caretPosition = this.selectionStart;
    let letterRejected = false;

    added = text;
    for (let char of prevtext) {
      added = added.replace(char, "");
    }
    addedIndex = this.selectionStart - added.length;

    deleted = prevtext;
    for (let char of text) {
      deleted = deleted.replace(char, "");
    }
    deletedIndex = this.selectionEnd + deleted.length;

    console.log(prevtext, text);
    console.log("added: "+added+" \nindex: "+addedIndex+"\ndeleted: "+deleted+"\nindex: "+deletedIndex+"\ncaret: "+caretPosition);

    let output = prevtext;
    if (deleted) {
      for (let char of deleted) {
        if (abcs.includes(char)) unuse_letter(char.toLowerCase());
      }
      output = output.substring(0, caretPosition) + output.substring(deletedIndex);

      if (addedIndex >= deletedIndex) {
        addedIndex -= deleted.length;
      }
    }

    let addable = "";
    if (added) {
      for (let char of added) {
        if (abcs.includes(char)) {
          let letter = use_letter(char.toLowerCase());
          if (letter) {
            addable += char;
          } else {
            letterRejected = true;
          }
        } else {
          addable += char;
        }
      }
      output = output.slice(0, addedIndex) + addable + output.slice(addedIndex);

      if (letterRejected) {
        this.classList.remove("rejected");
        this.classList.add("rejected");
        this.dataset.index = addedIndex + addable.length;
        this.onanimationend = function() {
          this.classList.remove("rejected");
          this.selectionStart = this.selectionEnd = this.dataset.index;
        }
        this.selectionStart = this.selectionEnd = this.dataset.index;
      }
    }

    if (output != prevtext) {
      playerdata.workshop = this.value;
      sfx("type");
    } else if (letterRejected) {
      sfx("error");
    }
    this.value = output;
  }

  workshop.addEventListener("input", update_workshop);
}
