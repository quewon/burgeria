var LANGUAGES = {
  currentLanguage: undefined,
};

function load_languages(onload) {
  const API_KEY = "AIzaSyBzXdECCWJJtWVx8QeZTm7NIWntlmdcX88";
  const SHEET_ID = "1FEVUm9JAapBC2to-y8GKW6C5WqQsOQQgMn7m-nVeFOw";

  fetch("https://sheets.googleapis.com/v4/spreadsheets/"+SHEET_ID+"/values/ui/?key="+API_KEY)
  .then((response) => response.json())
  .then((data) => {
    LANGUAGES.UI = SheetArrayToObject(data.values);
    load_dialogue(onload);
  });
}

function load_dialogue(onload) {
  const API_KEY = "AIzaSyBzXdECCWJJtWVx8QeZTm7NIWntlmdcX88";
  const SHEET_ID = "1FEVUm9JAapBC2to-y8GKW6C5WqQsOQQgMn7m-nVeFOw";

  fetch("https://sheets.googleapis.com/v4/spreadsheets/"+SHEET_ID+"/values/dialogue/?key="+API_KEY)
  .then((response) => response.json())
  .then((data) => {
    LANGUAGES.DIALOGUE = SheetArrayToObject(data.values);
    if (onload) onload();
  });
}

function SheetArrayToObject(array) {
  if (array == undefined) return undefined;

  const keys = array[0];
  const output = {};

  for (let column=1; column<keys.length; column++) {
    const lang = keys[column];
    output[lang] = {};
  }

  for (let row=1; row<array.length; row++) {
    var key = "";

    for (let column=0; column<keys.length; column++) {
      const value = array[row][column];
      if (keys[column] == "key") {
        key = value;
        continue;
      }
      const lang = keys[column];
      output[lang][key] = value;
    }
  }

  return output;
}

function setToKey(element, key, text) {
  if (key.includes("PLACEHOLDER_")) {
    element.setAttribute("placeholder", text);
  } else if (key.includes("TT_")) {
    element.setAttribute("title", text);
  } else if (key.includes("ALT_")) {
    element.setAttribute("alt", text);
  } else {
    if (text.includes("<em>") || text.includes("\n")) {
      text = text.replaceAll("\n", "<br />");
      element.innerHTML = text;
    } else {
      element.textContent = text;
    }
  }
  element.setAttribute("lang", LANGUAGES.currentLanguage);
}

function set_language(lang) {
  LANGUAGES.currentLanguage = lang;
  const UI = LANGUAGES.UI[lang];

  localizeElement(document.documentElement);

  updateDayUI();
  updateBankbook();
  updateResearchBlock();
  for (let piece of playerdata.workshop) {
    piece.updateUI();
  }
  for (let recipe of playerdata.recipes) {
    localizeElement(recipe.tray.element);
  }
  for (let request of playerdata.requests) {
    for (let rule of request.rules) {
      rule.updateLanguage();
    }
  }
  for (let guy of game.guys) {
    guy.updateLanguage();
  }
}

function toggle_language(button) {
  if (LANGUAGES.currentLanguage == "eng") {
    set_language("kor");
  } else {
    set_language("eng");
  }
}

function localizeElement(element) {
  if (LANGUAGES.currentLanguage == undefined) return;

  element.setAttribute("lang", LANGUAGES.currentLanguage);
  const UI = LANGUAGES.UI[LANGUAGES.currentLanguage];
  for (let key in UI) {
    const keyClass = ".local-"+key.toLowerCase().replaceAll("_", "-");
    var keyElements = element.querySelectorAll(keyClass);
    for (let i=0; i<keyElements.length; i++) {
      setToKey(keyElements[i], key, UI[key]);
    }
  }
}

function localized(category, key) {
  if (LANGUAGES.currentLanguage == undefined) {
    return "";
  } else {
    return LANGUAGES[category][LANGUAGES.currentLanguage][key] || "";
  }
}
