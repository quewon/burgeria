var WWW;

function write_data(piece) {
  const data = new FormData();
  data.append("text", piece.text || "");

  // all this possible, thanks to
  // https://github.com/levinunnink/html-form-to-google-sheet

  ui.dialogs["publishing-loading"].showModal();
  ui.dialogs["publishing-loading-canvas"].activate();

  // const http = new XMLHttpRequest();
  // const url = "https://script.google.com/macros/s/AKfycby6dOmupDq_FYd_gp1Y0HXSNJx67dy9ds4Zf_Xb4FFw1Hp9mMvjBs_AgnyJIp0jMLPQ/exec";
  // http.open("POST", url);
  //
  // http.addEventListener("load", function() {
  //   ui.dialogs["publishing-loading"].close();
  //   console.log("successfully published to the www.");
  //   if (onwrite) onwrite();
  //
  //   load_data(function() {
  //     console.log("refreshed www data.");
  //   });
  // });
  //
  // http.addEventListener("progress", function(e) {
  //   if (e.lengthComputable) {
  //     const percent = (e.loaded / e.total) * 100;
  //     console.log("** progress **\n"+Math.round(percent)+"%");
  //   }
  // });
  //
  // http.addEventListener("error", function(e) {
  //   console.log("** publishing error **\n"+e);
  //   ui.dialogs["publishing-loading"].close();
  //   ui.dialogs["publishing-error"].showModal();
  // });
  //
  // http.send(data);

  fetch("https://script.google.com/macros/s/AKfycby6dOmupDq_FYd_gp1Y0HXSNJx67dy9ds4Zf_Xb4FFw1Hp9mMvjBs_AgnyJIp0jMLPQ/exec", {
    method: "POST",
    body: data
  })
  .then(function(e) {
    ui.dialogs["publishing-loading"].close();
    ui.dialogs["publishing-loading-canvas"].deactivate();
    console.log("successfully published to the www.");
    piece.publishSucceeded();

    load_data(function() {
      console.log("refreshed www data.");
    });
  })
  .catch(function(e) {
    console.log("** publishing error **\n"+e);
    ui.dialogs["publishing-loading"].close();
    ui.dialogs["publishing-loading-canvas"].deactivate();
    ui.dialogs["publishing-error"].showModal();
    sfx("error");
  });
}

function load_data(onload) {
  const API_KEY = "AIzaSyBzXdECCWJJtWVx8QeZTm7NIWntlmdcX88";
  const SHEET_ID = "13D9a_zTj-VeDTHN0AZBJZ6rRc-fGsmWwRPXUGHBuc7M";

  fetch("https://sheets.googleapis.com/v4/spreadsheets/"+SHEET_ID+"/values/www/?key="+API_KEY)
  .then((response) => response.json())
  .then((data) => {
    WWW = SheetArrayToObjects(data.values);
    if (onload) onload();
  });

  function SheetArrayToObjects(array) {
    if (array == undefined) return undefined;

    const keys = array[0];
    const output = [];

    for (let row=1; row<array.length; row++) {
      var entry = {};
      var remove = false;

      for (let column=0; column<keys.length; column++) {
        var value = array[row][column];

        if (keys[column] == "remove" && value) {
          remove = true;
          break;
        }

        entry[keys[column]] = value;
      }

      if (!remove) output.push(entry);
    }

    return output;
  }
}

function newRandomWWWPiece() {
  if (WWW.length == 0) return;

  var pieceIndex = Math.random() * WWW.length | 0;

  var i=1;
  while (game.market.includes(WWW[pieceIndex].text)) {
    pieceIndex++;
    if (pieceIndex >= WWW.length) pieceIndex = 0;
    i++;
    if (i > WWW.length) return false;
  }

  const piece = WWW[pieceIndex];
  new PieceAlert(piece.text);
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

    new LibraryPiece(this.text, this.cost);

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
  constructor(text, cost) {
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
        updateList(ui.kitchen.lettersList, playerdata.letters);
        updateList(ui.workshop.lettersList, playerdata.letters);
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
