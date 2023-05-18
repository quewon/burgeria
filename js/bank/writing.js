var WWW;
const API_KEY = "AIzaSyBzXdECCWJJtWVx8QeZTm7NIWntlmdcX88";
const SHEET_ID = "13D9a_zTj-VeDTHN0AZBJZ6rRc-fGsmWwRPXUGHBuc7M";
const SHEET_URL = "https://sheets.googleapis.com/v4/spreadsheets/"+SHEET_ID+"/values/www/?key="+API_KEY;

fetch(SHEET_URL)
.then((response) => response.json())
.then((data) => {
  WWW = SheetArrayToObjects(data.values);
  on_data_loaded();
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
