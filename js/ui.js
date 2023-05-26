var ui = {
  dialogs: {
    "no-points": document.getElementById("dialog-no-points"),
    "read-text": document.getElementById("dialog-read-text"),
    "read-text-title": document.getElementById("dialog-read-text-title"),
    "read-text-content": document.getElementById("dialog-read-text-content"),
    "no-pages": document.getElementById("dialog-no-pages"),
    "no-letters": document.getElementById("dialog-no-letters"),
    "early-close": document.getElementById("dialog-early-close"),

    "help-burgeria": document.getElementById("dialog-help-burgeria"),
    "help-burgeria-canvas": new Canvas3D(document.getElementById("help-burgeria-canvas")),

    "publishing-loading": document.getElementById("dialog-publishing-loading"),
    "publishing-loading-canvas": new Canvas3D(document.getElementById("publishing-loading-canvas")),

    "publishing-error": document.getElementById("dialog-publishing-error"),
    "publishing-error-no-letters": document.getElementById("dialog-publishing-error-no-letters"),
    "publishing-success": document.getElementById("dialog-publishing-success"),
    "publishing-success-content": document.getElementById("dialog-publishing-success-content"),
    "wind": document.getElementById("dialog-wind"),
    "wind-content": document.getElementById("dialog-wind-content")
  },
  templates: {
    "tray": document.getElementById("template-tray"),
    "news-headline": document.getElementById("template-news-headline"),
    "news-prices": document.getElementById("template-news-prices"),
    "guy": document.getElementById("template-guy"),
    "feedback-napkin": document.getElementById("template-feedback-napkin"),
    "writing-alert": document.getElementById("template-writing-alert"),
    "market-alert": document.getElementById("template-market-alert"),
    "facade-piece": document.getElementById("template-facade-piece")
  },
  scenes: {
    "storefront": document.getElementById("scene-storefront"),
    "kitchen": document.getElementById("scene-kitchen"),
    "workshop": document.getElementById("scene-workshop"),
    "facade": document.getElementById("scene-facade")
  },
  currentScene: "storefront",
  themeName: document.getElementById("theme-name"),
  "storefront": {
    sceneButton: document.getElementById("storefront-scene-button"),
    body: document.getElementById("scene-storefront-body"),
    news: document.getElementById("scene-storefront-news"),
    recipesList: document.getElementById("scene-recipes"),
    recipePreviewCanvas: new Canvas3D(document.getElementById("recipe-preview-canvas")),
    ministock: document.getElementById("storefront-ministock"),
    ministockTray: null,
    guysList: document.getElementById("storefront-guys-list"),
    guysListTray: null,
    recipePreview: document.getElementById("recipe-preview"),
    recipePreviewContext: document.getElementById("recipe-preview").querySelector("canvas").getContext("2d"),
    menuEditButton: document.getElementById("menu-edit-button"),
    menuStockbutton: document.getElementById("menu-stockbutton"),
    day: {
      toggleButton: document.getElementById("day-toggle-button"),
      state: document.getElementById("day-state"),
      timer: document.getElementById("burgeria-timer"),
      icon: document.getElementById("burgeria-day-icon"),
      guysContainer: document.getElementById("guys-container"),
      overtimeMessage: document.getElementById("burgeria-overtime-message"),
      counter: document.getElementById("day-counter"),
    },
    lettersList: document.getElementById("storefront-letters-list"),
    lettersContainer: document.getElementById("storefront-letters-list-block")
  },
  "kitchen": {
    sceneButton: document.getElementById("kitchen-scene-button"),
    ingredientButtons: document.getElementById("ingredient-buttons"),
    library: {
      page: document.getElementById("library-page"),
      pagesTotal: document.getElementById("library-pages-total"),
      index: document.getElementById("library-index"),
      nav: document.getElementById("library-nav"),
      pageContainer: document.getElementById("library-page-container"),
      pageEmptyMessage: document.getElementById("library-page-empty")
    },
    libraryBlock: document.getElementById("library-block"),
    inventoryList: document.getElementById("inventory-list"),
    inventoryBlock: document.getElementById("inventory-block"),
    lettersList: document.getElementById("kitchen-letters-list"),
    lettersContainer: document.getElementById("kitchen-letterstock"),
    pointsCounter: document.getElementById("points-counter"),
    bankbook: document.getElementById("bankbook"),
    bankbookLabel: document.getElementById("bankbook-label"),
    bankbookBlock: document.getElementById("bankbook-block"),
    researchBlock: document.getElementById("research-block"),
    bookshelf: document.getElementById("bookshelf"),
  },
  "workshop": {
    textarea: document.getElementById("workshop-textarea"),
    sceneButton: document.getElementById("workshop-scene-button"),
    market: document.getElementById("market"),
    marketEmptyMessage: document.getElementById("market-empty"),
    lettersList: document.getElementById("workshop-letters-list"),
    library: document.getElementById("workshop-library"),
    wordsCount: document.getElementById("workshop-words"),
    lettersCount: document.getElementById("workshop-letters"),
    kitchenLibraryButton: document.getElementById("market-library-button")
  },
  "facade": {
    sceneButton: document.getElementById("facade-scene-button"),
    list: document.getElementById("facade-list")
  }
};

function setScene(name) {
  let dropdownAnchors = document.getElementsByClassName("dropdown-anchor");
  for (let anchor of dropdownAnchors) {
    anchor.classList.remove("activated");
  }

  for (let scenename in ui.scenes) {
    const scene = ui.scenes[scenename];
    if (name != scenename) {
      scene.classList.add("hidden");
      ui[scenename].sceneButton.classList.remove("selected");
      ui[scenename].sceneButton.removeAttribute("disabled");
    } else {
      scene.classList.remove("hidden");
      ui[scenename].sceneButton.classList.add("selected");
      ui[scenename].sceneButton.setAttribute("disabled", true);
    }
  }
  ui.currentScene = name;

  var temps = document.getElementsByClassName("temp");
  for (let i=temps.length-1; i>=0; i--) {
    temps[i].remove();
  }

  switch (name) {
    case "kitchen":
      if (playerdata.library.length == 0) ui.kitchen.libraryBlock.classList.add("gone");
      ui.kitchen.lettersContainer.classList.add("gone");
      ui.kitchen.bankbookLabel.style.width = ui.kitchen.bankbook.offsetWidth+"px";
      ui.kitchen.bankbook.parentNode.scrollTop = ui.kitchen.bankbook.parentNode.scrollHeight;
      break;
    case "workshop":
      ui.workshop.textarea.focus();
      break;
  }
}

// utility functions

function divContainingTemplate(templateName) {
  let div = document.createElement("div");
  let template = ui.templates[templateName];
  let clone = template.content.cloneNode(true);
  div.appendChild(clone);
  return div;
}

function divContainingPerfectClone(element) {
  let clone = document.createElement("div");
  clone.innerHTML = element.outerHTML;

  const rect = element.getBoundingClientRect();
  clone.style.width = rect.width+"px";
  clone.style.height = rect.height+"px";
}

// update functions

function selectBook(el, index) {
  el.classList.toggle("selected");

  if (el.classList.contains("selected")) {
    const books = document.querySelectorAll("[type='book']");
    for (let book of books) {
      book.classList.remove("selected");
    }
    el.classList.add("selected");
    playerdata.libraryIndex = index;
    updateLibrary();
    ui.kitchen.libraryBlock.classList.remove("gone");
  } else {
    ui.kitchen.libraryBlock.classList.add("gone");
  }
}

function createSystemBook(uiElement, title, icon) {
  const bookshelf = ui.kitchen.bookshelf;
  var book = document.createElement("button");
  book.classList.add("system");
  book.classList.add("book");
  if (icon) book.setAttribute("name", icon);

  if (!uiElement.classList.contains("gone")) {
    book.classList.add("selected");
  }

  createBookLabel(book, title);

  book.onclick = function() {
    this.classList.toggle("selected"); uiElement.classList.toggle("gone");
  };

  bookshelf.appendChild(book);

  return book;
}

function createBookLabel(parent, text) {
  for (let char of text) {
    var div = document.createElement("div");
    div.textContent = char;
    parent.appendChild(div);
  }
  parent.style.width=Math.ceil(text.length / 10)+"rem";
}

function updateBookshelf(dontHideLibrary) {
  const bookshelf = ui.kitchen.bookshelf;

  bookshelf.innerHTML = "";

  createSystemBook(ui.kitchen.bankbookBlock, "bankbook", "✸");
  createSystemBook(ui.kitchen.inventoryBlock, "stock", "☰");
  createSystemBook(ui.kitchen.researchBlock, "r&d", "⚙");
  // if (playerdata.library.length == 0) {
  //   const book = createSystemBook(ui.kitchen.libraryBlock, "library", "");
  //   if (!dontHideLibrary) book.onclick();
  // }
  if (!dontHideLibrary) {
    ui.kitchen.libraryBlock.classList.add("gone");
  }

  for (let book of playerdata.library) {
    ui.kitchen.bookshelf.appendChild(book.element);
  }
}

function toggleMenuEditMode() {
  const preview = ui.storefront.recipePreview;
  const button = ui.storefront.menuEditButton;

  preview.classList.toggle("editmode");

  if (!ui.storefront.ministock.classList.contains("gone")) {
    const tray = playerdata.recipes[game.recipeIndex].tray;
    tray.toggleGlobalBlock("ministock", tray.stockbutton);
  }

  if (!preview.classList.contains("editmode")) {
    ui.storefront.lettersContainer.classList.add("gone");
  }

  // if (!preview.classList.contains("editmode")) {
  //   for (let i=playerdata.recipes.length-1; i>=0; i--) {
  //     const recipe = playerdata.recipes[i];
  //     if (recipe.calculateSize() == 0) {
  //       recipe.delete();
  //     }
  //   }
  // }
}

function toggleTheme(button) {
  playerdata.themeIndex++;
  if (playerdata.themeIndex > game.themes.order.length - 1) playerdata.themeIndex = 0;
  let name = game.themes.order[playerdata.themeIndex];
  let theme = game.themes[name];

  for (let key in theme) {
    let value = theme[key];
    document.documentElement.style.setProperty("--"+key, value);
  }

  ui.themeName.textContent = name;
}

function updateDayUI() {
  let dtb = ui.storefront.day.toggleButton;
  let di = ui.storefront.day.icon;
  let timer = ui.storefront.day.timer;
  let state = ui.storefront.day.state;
  let overtime = ui.storefront.day.overtimeMessage;
  let counter = ui.storefront.day.counter;

  overtime.onanimationend = function() {
    if (ui.storefront.guysListTray) {
      const tray = ui.storefront.guysListTray;
      tray.updateGlobalBlockPosition("guysList", tray.sendbutton);
    }
    if (ui.storefront.ministockTray) {
      const tray = ui.storefront.ministockTray;
      tray.updateGlobalBlockPosition("ministock", tray.stockbutton);
    }
  }

  if (game.storetime == -1) {
    let all_served = true;
    for (let guy of game.guys) {
      if (!guy.served) {
        all_served = false;
        break;
      }
    }
    if (!all_served) {
      dtb.setAttribute("disabled", true);
      di.textContent = "☾";
      overtime.classList.remove("gone");
    } else {
      dtb.removeAttribute("disabled");
      di.textContent = "☼";
      overtime.classList.add("gone");
    }

    counter.textContent = playerdata.day;
    dtb.textContent = "open store";
    timer.style.height = "100%";
    state.textContent = "CLOSED";
  } else {
    dtb.textContent = "close store early";
    di.textContent = "☼";
    state.textContent = "OPEN";
    timer.style.height = "0%";
    timer.classList.add("transition");
    timer.onanimationend = function() {
      ui.storefront.day.timer.classList.remove("transition");
    };
  }
}

function updatePoints() {
  ui.kitchen.pointsCounter.textContent = playerdata.points;
}

function updateRecipes() {
  while (ui.storefront.recipesList.lastElementChild) {
    ui.storefront.recipesList.lastElementChild.remove();
  }

  let categories = {};

  for (let recipe of playerdata.recipes) {
    if (!(recipe.category in categories)) {
      categories[recipe.category] = [];
    }
    categories[recipe.category].push(recipe);
    recipe.setDiscounted(!game.daytime);
  }

  let i=0;
  for (let name in categories) {
    const category = categories[name];
    let label = document.createElement("b");
    label.textContent = category[0].category.toUpperCase();
    let ul = document.createElement("ul");
    for (let recipe of category) {
      recipe.domIndex = i;
      ul.appendChild(recipe.element);
      i++;
    }
    ui.storefront.recipesList.appendChild(label);
    ui.storefront.recipesList.appendChild(ul);
  }
}

function updateGuysList() {
  const list = ui.storefront.guysList;

  while (list.lastElementChild) {
    list.lastElementChild.remove();
  }

  if (game.guys.length > 0) {
    list.innerHTML = "";
  } else {
    list.innerHTML = "<div class='block'><i>Nobody to serve.</i></div>";
  }

  for (let i=0; i<game.guys.length; i++) {
    if (game.guys[i].served) continue;

    let button = document.createElement("button");
    button.dataset.id = i;
    button.textContent = i+1;
    button.onclick = function() {
      const tray = ui.storefront.guysListTray;
      tray.send(Number(button.dataset.id));
    }
    list.appendChild(button);
  }
}

function updateMinistockWindow() {
  const ministock = ui.storefront.ministock;

  if (updateList(ministock, playerdata.inventory.list)) {
    for (let li of ministock.children) {
      li.classList.add("draggable");
      li.addEventListener("mousedown", function(e) {
        if (!this.name) return;

        let tray = game.trays[this.parentNode.dataset.id];
        let item = playerdata.inventory.removeItemByName(this.name);
        if (!item) return;
        item.drag();
      });
    }
  }
}

function updateLibrary() {
  if (playerdata.library.length == 0) {
    ui.workshop.kitchenLibraryButton.setAttribute("disabled", true);
    // ui.kitchen.libraryBlock.classList.add("gone");
  } else {
    ui.workshop.kitchenLibraryButton.removeAttribute("disabled");
    // ui.kitchen.libraryBlock.classList.remove("gone");
  }

  const piece = playerdata.library[playerdata.libraryIndex];

  if (piece) {
    ui.kitchen.library.page.textContent = piece.text;

    ui.kitchen.library.pageContainer.classList.remove("gone");
    ui.kitchen.library.pageEmptyMessage.classList.add("gone");
  } else {
    ui.kitchen.library.page.innerHTML = "<i>There are no words here.</i>";

    ui.kitchen.library.pageContainer.classList.add("gone");
    ui.kitchen.library.pageEmptyMessage.classList.remove("gone");
  }

  ui.kitchen.library.pagesTotal.textContent = playerdata.library.length;
  ui.kitchen.library.index.textContent = playerdata.libraryIndex + 1;

  let buttons = ui.kitchen.library.nav.querySelectorAll("button");
  buttons[0].setAttribute("disabled", true);
  buttons[1].setAttribute("disabled", true);
  if (playerdata.library.length > 1) {
    if (playerdata.libraryIndex > 0) buttons[0].removeAttribute("disabled");
    if (playerdata.libraryIndex < playerdata.library.length - 1) {
      buttons[1].removeAttribute("disabled");
    }
  }
}

function navigateLibrary(value) {
  playerdata.libraryIndex += value;
  if (playerdata.libraryIndex < 0) playerdata.libraryIndex = 0;
  if (playerdata.libraryIndex >= playerdata.library.length) playerdata.libraryIndex = playerdata.library.length - 1;
  if (document.querySelectorAll("[type='book']").length > 0)
    selectBook(document.querySelectorAll("[type='book']")[playerdata.libraryIndex], playerdata.libraryIndex);
}

function updateList(listElement, listObject) {
  while (listElement.lastElementChild) {
    listElement.lastElementChild.remove();
  }

  let inventoryOccupied = false;
  for (let name in listObject) {
    if (listObject[name] == 0) continue;

    inventoryOccupied = true;
    let li = document.createElement("li");
    li.name = name;
    li.textContent = name+" ("+listObject[name]+")";
    listElement.appendChild(li);
  }

  if (!inventoryOccupied) {
    let span = document.createElement("i");
    span.textContent = "It's empty...";
    listElement.appendChild(span);
    return false;
  }

  if (ui.currentScene == "kitchen" && listElement == ui.kitchen.lettersList) {
    ui.kitchen.lettersContainer.classList.remove("gone");
  }

  return true;
}

function addEmptyLabel(element) {
  if (!market.lastElementChild) {
    let span = document.createElement("i");
    span.textContent = "It's empty...";
    market.appendChild(span);
  }
}

function updateBankbook() {
  const table = ui.kitchen.bankbook;
  const bankbook = playerdata.bankbook;
  const label = ui.kitchen.bankbookLabel;

  while (table.lastElementChild) {
    table.lastElementChild.remove();
  }

  let keys = ["day", "description", "withdrawals", "deposits", "balance"];
  let keysElement = document.createElement("tr");
  for (let key of keys) {
    let th = document.createElement("th");
    th.textContent = key;
    keysElement.appendChild(th);
  }
  table.appendChild(keysElement);

  for (let line of bankbook) {
    let tr = document.createElement("tr");
    for (let v of line) {
      let td = document.createElement("td");
      td.textContent = v;
      tr.appendChild(td);
    }
    table.appendChild(tr);
  }

  ui.kitchen.bankbookLabel.style.width = ui.kitchen.bankbook.getBoundingClientRect().width+"px";
}

function updateFacadeList() {
  const list = ui.facade.list;

  const workshopList = list.querySelector("[name='workshop']");
  const workshopEmptyMessage = list.querySelector("[name='workshop-none']")
  while (workshopList.lastElementChild) {
    workshopList.lastElementChild.remove();
  }

  var workshopPiecesListed = 0;
  for (let piece of playerdata.workshop) {
    if (piece.lettersCount() == 0) continue;
    workshopPiecesListed++;

    var li = document.createElement("li");

    var button = document.createElement("button");
    button.textContent = piece.title;
    button.dataset.index = piece.index;
    button.onclick = function() {
      const piece = playerdata.workshop[this.dataset.index];
      new FacadePiece(piece.text, "workshop");
      piece.inputManager.burn();
      piece.removeFromWorkshop();
      updateFacadeList();
    }
    li.appendChild(button);

    workshopList.appendChild(li);
  }

  if (workshopPiecesListed == 0) {
    workshopEmptyMessage.classList.remove("gone");
  } else {
    workshopEmptyMessage.classList.add("gone");
  }

  const libraryList = list.querySelector("[name='library']");
  const libraryEmptyMessage = list.querySelector("[name='library-none']");
  if (playerdata.library.length > 0) {
    libraryList.classList.remove("gone");
    libraryEmptyMessage.classList.add("gone");

    while (libraryList.lastElementChild) {
      libraryList.lastElementChild.remove();
    }

    for (let piece of playerdata.library) {
      var li = document.createElement("li");

      var button = document.createElement("button");
      button.textContent = piece.title;
      button.dataset.index = piece.index;
      button.onclick = function() {
        const piece = playerdata.library[this.dataset.index];
        new FacadePiece(piece.text, "library");
        piece.removeFromLibrary();
        updateFacadeList();
      }
      li.appendChild(button);

      libraryList.appendChild(li);
    }
  } else {
    libraryList.classList.add("gone");
    libraryEmptyMessage.classList.remove("gone");
  }
}

function toggleDropdown(button) {
  const container = button.parentNode;
  const parent = container.parentNode;
  const dropdown = button.nextElementSibling;

  for (let child of parent.children) {
    const anchor = child.firstElementChild;
    if (anchor && anchor != button && anchor.classList.contains("dropdown-anchor")) {
      anchor.classList.remove("activated");
    }
  }

  // if (!button.classList.contains("activated") && !container.onmouseleave) {
  //   container.onmouseleave = function(e) {
  //     if (this.firstElementChild.classList.contains("activated")) toggleDropdown(this.firstElementChild);
  //   }
  // }

  button.classList.toggle("activated");
}
