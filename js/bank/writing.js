var BANK_WWW;
var BANK_LOCAL;

function write_data(text, cost) {
  var data = new FormData();
  data.set("text", text || "");
  data.set("cost", cost.toString() || "");

  const url = "https://script.google.com/macros/s/AKfycbzRKbrsf158qdo6BbFn925agIOIp93YwwYND0k3zeugBqcXSAczA7FudEXaePDSy8G4_A/exec";
  fetch(url, {
    method: 'POST',
    body: data
  })
  .then(function(response) {
    console.log("successfully published to the www.");
  })
  .catch(function(error) {
    console.error("** publishing error **\n", error);
    ui.dialogs["publishing-error"].showModal();
  });
}

function load_data() {
  const API_KEY = "AIzaSyBzXdECCWJJtWVx8QeZTm7NIWntlmdcX88";
  const SHEET_ID = "13D9a_zTj-VeDTHN0AZBJZ6rRc-fGsmWwRPXUGHBuc7M";

  fetch("https://sheets.googleapis.com/v4/spreadsheets/"+SHEET_ID+"/values/www/?key="+API_KEY)
  .then((response) => response.json())
  .then((data) => {
    BANK_WWW = SheetArrayToObjects(data.values);
    console.log("loaded www data.");

    fetch("https://sheets.googleapis.com/v4/spreadsheets/"+SHEET_ID+"/values/local/?key="+API_KEY)
    .then((response) => response.json())
    .then((data) => {
      BANK_LOCAL = SheetArrayToObjects(data.values);
      console.log("loaded local data.");
      on_data_loaded();
    });
  });

  function SheetArrayToObjects(array) {
    if (array == undefined) return undefined;

    const keys = array[0];
    const output = [];

    for (let i=1; i<array.length; i++) {
      var entry = {};
      for (let x=0; x<keys.length; x++) {
        var value = array[i][x];

        if (keys[x] == "cost") {
          value = value ? Number(value) : 0;
        }

        entry[keys[x]] = value;
      }

      output.push(entry);
    }

    return output;
  }
}
