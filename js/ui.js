var ui = {
  dialogs: {
    "no-points": document.getElementById("dialog-no-points"),
    "read-text": document.getElementById("dialog-read-text"),
    "read-text-title": document.getElementById("dialog-read-text-title"),
    "read-text-content": document.getElementById("dialog-read-text-content"),
    "no-letters": document.getElementById("dialog-no-letters"),
    "early-close": document.getElementById("dialog-early-close"),
    "help-burgeria": document.getElementById("dialog-help-burgeria")
  },
  templates: {
    "template-tray": document.getElementById("template-tray"),
    "template-news-headline": document.getElementById("template-news-headline"),
    "template-news-prices": document.getElementById("template-news-prices"),
    "template-guy": document.getElementById("template-guy"),
    "template-feedback-napkin": document.getElementById("template-feedback-napkin"),
    "template-writing-alert": document.getElementById("template-writing-alert"),
  },
  scenes: {
    "storefront": document.getElementById("scene-storefront"),
    "kitchen": document.getElementById("scene-kitchen"),
    "workshop": document.getElementById("scene-workshop")
  },
  currentScene: "storefront",
  currentSceneLabel: document.getElementById("current-scene-label"),
  themeName: document.getElementById("theme-name"),
  "storefront": {
    sceneButton: document.getElementById("storefront-scene-button"),
    body: document.getElementById("scene-storefront-body"),
    news: document.getElementById("scene-storefront-news"),
    recipesList: document.getElementById("scene-recipes"),
    ministock: document.getElementById("storefront-ministock"),
    ministockTray: null,
    guysList: document.getElementById("storefront-guys-list"),
    guysListTray: null,
    recipePreview: document.getElementById("recipe-preview"),
    recipePreviewContext: document.getElementById("recipe-preview").querySelector("canvas").getContext("2d"),
    menuEditButton: document.getElementById("menu-edit-button"),
    day: {
      toggleButton: document.getElementById("day-toggle-button"),
      state: document.getElementById("day-state"),
      timer: document.getElementById("burgeria-timer"),
      icon: document.getElementById("burgeria-day-icon"),
      guysContainer: document.getElementById("guys-container"),
      overtimeMessage: document.getElementById("burgeria-overtime-message"),
      counter: document.getElementById("day-counter"),
    },
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
      // pageEmptyMessage: document.getElementById("library-page-empty")
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
  ui.currentSceneLabel.textContent = name;

  if (name == "kitchen") {
    ui.kitchen.lettersContainer.classList.add("gone");
    ui.kitchen.bankbookLabel.style.width = ui.kitchen.bankbook.offsetWidth+"px";
    ui.kitchen.bankbook.parentNode.scrollTop = ui.kitchen.bankbook.parentNode.scrollHeight;
  } else if (name == "workshop") {
    ui.workshop.textarea.focus();
  }
}

// utility functions

function divContainingTemplate(templateId) {
  let div = document.createElement("div");
  let template = ui.templates[templateId];
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
}

function createBookLabel(parent, text) {
  for (let char of text) {
    var div = document.createElement("div");
    div.textContent = char;
    parent.appendChild(div);
  }
  parent.style.width=Math.ceil(text.length / 10)+"rem";
}

function createBook(title, index) {
  const bookshelf = ui.kitchen.bookshelf;

  var book = document.createElement("button");
  book.classList.add("book");
  book.setAttribute("type", "book");
  book.dataset.index = index;
  book.onclick = function() {
    selectBook(this, Number(this.dataset.index));
  };

  createBookLabel(book, title);

  bookshelf.appendChild(book);
}

function updateBookshelf() {
  const bookshelf = ui.kitchen.bookshelf;

  bookshelf.innerHTML = "";

  createSystemBook(ui.kitchen.bankbookBlock, "bankbook", "✸");
  createSystemBook(ui.kitchen.inventoryBlock, "stock", "☰");
  // createSystemBook(ui.kitchen.researchBlock, "r&d", "⚙");

  for (let index in playerdata.library) {
    const book = playerdata.library[index];
    createBook(book.title, index);
  }
}

function toggleMenuEditMode() {
  const preview = ui.storefront.recipePreview;
  const button = ui.storefront.menuEditButton;

  preview.classList.toggle("editmode");
  if (preview.classList.contains("editmode")) {

  }
}

function toggleTheme(button) {
  playerdata.themes.index++;
  if (playerdata.themes.index > playerdata.themes.order.length - 1) playerdata.themes.index = 0;
  let name = playerdata.themes.order[playerdata.themes.index];
  let theme = playerdata.themes[name];

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

  if (playerdata.storetime == -1) {
    let all_served = true;
    for (let guy of playerdata.guys) {
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
      ui.storefront.ministock.classList.add("gone");
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
    ui.storefront.ministock.classList.add("gone");
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
    recipe.setDiscounted(!playerdata.daytime);
  }

  for (let name in categories) {
    const category = categories[name];
    let label = document.createElement("b");
    label.textContent = category[0].category.toUpperCase();
    let ul = document.createElement("ul");
    for (let recipe of category) {
      ul.appendChild(recipe.element);
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

  for (let i=0; i<playerdata.guys.length; i++) {
    if (playerdata.guys[i].served) continue;

    let button = document.createElement("button");
    button.dataset.id = i;
    button.textContent = i+1;
    button.onclick = function() {
      const tray = ui.storefront.guysListTray;
      if (tray.enabled) {
        tray.send(Number(button.dataset.id));
      }
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

        let tray = playerdata.trays[this.parentNode.dataset.id];
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
    ui.kitchen.libraryBlock.classList.add("gone");
  } else {
    ui.workshop.kitchenLibraryButton.removeAttribute("disabled");
    ui.kitchen.libraryBlock.classList.remove("gone");
  }

  let page = playerdata.library[playerdata.libraryIndex];

  if (page) {
    ui.kitchen.library.page.textContent = page.text;

    ui.kitchen.library.pageContainer.classList.remove("gone");
    // ui.kitchen.library.pageEmptyMessage.classList.add("gone");
  } else {
    ui.kitchen.library.page.innerHTML = "<i>There are no words here.</i>";

    ui.kitchen.library.pageContainer.classList.add("gone");
    // ui.kitchen.library.pageEmptyMessage.classList.remove("gone");
  }

  ui.kitchen.library.pagesTotal.textContent = playerdata.library.length;
  ui.kitchen.library.index.textContent = playerdata.libraryIndex + 1;

  let buttons = ui.kitchen.library.nav.querySelectorAll("button");
  buttons[0].setAttribute("disabled", true);
  buttons[1].setAttribute("disabled", true);
  if (playerdata.library.length > 1) {
    if (playerdata.libraryIndex > 0) {
      buttons[0].removeAttribute("disabled");
    }
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
}

function updateWorkshopLetterCount() {
  const words = ui.workshop.wordsCount;
  const letters = ui.workshop.lettersCount;
  const piece = playerdata.workshop[playerdata.workshopIndex];
  words.textContent = piece.wordsCount();
  letters.textContent = piece.lettersCount();
}

function deselectWorkshopLibraryButton() {
  const og = ui.workshop.library.children[playerdata.workshopIndex];
  if (!og) return;
  og.classList.remove("selected");
  og.classList.remove("focused");
  og.removeAttribute("disabled");
}

function createWorkshopLibraryButton(i) {
  const lib = ui.workshop.library;
  const pieces = playerdata.workshop;

  let button = document.createElement("button");
  button.textContent = pieces[i].title;
  button.dataset.index = i;
  button.onclick = function() {
    deselectWorkshopLibraryButton();
    playerdata.workshopIndex = this.dataset.index;
    this.classList.add("selected");
    this.classList.add("focused");
    this.setAttribute("disabled", true);
    ui.workshop.textarea.value = playerdata.workshop[playerdata.workshopIndex].text;
    updateWorkshopLetterCount();
  }
  lib.appendChild(button);

  if (i==playerdata.workshopIndex) {
    button.classList.add("selected");
    button.classList.add("focused");
    button.setAttribute("disabled", true);
  }
}

function updateWorkshopLibrary() {
  const lib = ui.workshop.library;
  const pieces = playerdata.workshop;

  while (lib.lastElementChild) {
    lib.lastElementChild.remove();
  }

  for (let i=0; i<pieces.length; i++) {
    createWorkshopLibraryButton(i);
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

// news

class Headline {
  constructor(line1, line2) {
    let div = divContainingTemplate("template-news-headline");
    ui.storefront.news.appendChild(div);

    let l1 = div.querySelector("#line1");
    let l2 = div.querySelector("#line2");

    if (line1) l1.textContent = line1;
    if (line2) l2.textContent = line2;

    this.squeeze(l1.parentNode);
    this.squeeze(l2.parentNode);
  }

  squeeze(element) {
    let xscale = element.clientWidth / element.scrollWidth;
    if (xscale < 1) {
      element.style.transform = "scaleX("+xscale+")";
    }
  }
}

class Prices {
  constructor() {
    let div = divContainingTemplate("template-news-prices");
    div.style.position = "relative";

    ui.storefront.news.appendChild(div);

    //

    let graph = div.querySelector(".prices-graph");
    let pointsholder = div.querySelector(".points-holder");
    let points = [0, 25, 50, 75, 100];
    let divrect = div.getBoundingClientRect();
    for (let point of points) {
      let label = document.createElement("span");
      label.textContent = point;
      label.className = "graphvaluepoint";
      label.style.bottom = point+"%";
      pointsholder.appendChild(label);

      let rect = label.getBoundingClientRect();
      let line = document.createElement("div");
      line.className = "graphline";
      line.style.top = (rect.top - divrect.top)+"px";

      div.appendChild(line);
    }

    let abcprices = playerdata.prices;
    let abc = "abcdefghijklmnopqrstuvwxyz";
    for (let i=0; i<abc.length; i++) {
      let char = abc[i];
      let label = document.createElement("span");
      label.textContent = char;
      label.classList.add("graphlabel");
      label.style.gridColumnStart = i+2;
      label.style.gridRowStart = 2;
      graph.appendChild(label);

      let p = abcprices[char];
      let currentPrice = p[p.length - 1];
      let previousPrice = p[p.length - 2];
      let diff = currentPrice - previousPrice;

      let bar = document.createElement("div");
      bar.style.height = currentPrice+"%";
      bar.style.gridRowStart = 1;
      bar.style.gridColumnStart = i+2;
      if (diff > 0) {
        bar.className = "graphbar positive";
      } else if (diff == 0) {
        bar.className = "graphbar";
      } else {
        bar.className = "graphbar negative";
      }
      graph.appendChild(bar);

      if (diff != 0) {
        let cbar = document.createElement("div");
        cbar.style.height = previousPrice+"%";
        cbar.style.gridRowStart = 1;
        cbar.style.gridColumnStart = i+2;
        if (diff > 0) {
          cbar.className = "graphbar past positive";
        } else {
          cbar.className = "graphbar past negative";
        }
        graph.appendChild(cbar);
      }

      let hoverarea = document.createElement("div");
      hoverarea.style.gridRowStart = 1;
      hoverarea.style.gridRowEnd = 3;
      hoverarea.style.gridColumnStart = i+2;
      hoverarea.style.zIndex = 10;
      hoverarea.style.position = "relative";

      let tooltip = document.createElement("div");
      tooltip.innerHTML = char+"<br><span class='burgerpoints'></span>"+currentPrice;
      if (diff != 0) {
        tooltip.innerHTML += " <span style='color:"+(diff > 0 ? "var(--graph-positive)'>↑" : "var(--graph-negative)'>↓")+Math.abs(diff)+"</span>";
      }

      tooltip.className = "tooltip gone";
      hoverarea.appendChild(tooltip);

      hoverarea.addEventListener("mouseover", function() {
        this.firstElementChild.classList.remove("gone");
      });
      hoverarea.addEventListener("mouseout", function() {
        this.firstElementChild.classList.add("gone");
      });

      graph.appendChild(hoverarea);
    }
  }
}
