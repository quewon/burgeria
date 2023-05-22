var WWW;

function write_data(text, onwrite) {
  const data = new FormData();
  data.append("text", text || "");

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
    if (onwrite) onwrite();

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
