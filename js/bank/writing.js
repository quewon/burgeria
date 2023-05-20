var WWW;

function write_data(text, cost) {
  const data = new FormData();
  data.append("text", text || "");
  data.append("cost", cost ? cost.toString() : "");

  fetch("https://script.google.com/macros/s/AKfycby6dOmupDq_FYd_gp1Y0HXSNJx67dy9ds4Zf_Xb4FFw1Hp9mMvjBs_AgnyJIp0jMLPQ/exec", {
    method: "POST",
    body: data
  })
  .then(function(e) {
    load_data(function() {
      console.log("refreshed www data.");
      console.log("successfully published to the www.");
    });
  })
  .catch(function(e) {
    console.log("** publishing error **\n"+e);
    ui.dialogs["publishing-error"].showModal();
  });
}

function load_data(onload) {
  const API_KEY = "AIzaSyBzXdECCWJJtWVx8QeZTm7NIWntlmdcX88";
  const SHEET_ID = "13D9a_zTj-VeDTHN0AZBJZ6rRc-fGsmWwRPXUGHBuc7M";

  fetch("https://sheets.googleapis.com/v4/spreadsheets/"+SHEET_ID+"/values/www/?key="+API_KEY)
  .then((response) => response.json())
  .then((data) => {
    WWW = SheetArrayToObjects(data.values);
    onload();
  });

  function SheetArrayToObjects(array) {
    if (array == undefined) return undefined;

    const keys = array[0];
    const output = [];

    for (let i=1; i<array.length; i++) {
      var entry = {};
      var remove = false;
      for (let x=0; x<keys.length; x++) {
        var value = array[i][x];
        if (keys[x] == "remove" && value != "") {
          remove = true;
          break;
        }

        if (keys[x] == "cost") {
          value = value ? Number(value) : 0;
        }

        entry[keys[x]] = value;
      }

      if (!remove) output.push(entry);
    }

    return output;
  }
}
