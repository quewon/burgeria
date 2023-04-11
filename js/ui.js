var scenes = {
  templates: {
    "template-tray": document.getElementById("template-tray"),
    "template-news-headline": document.getElementById("template-news-headline"),
    "template-news-prices": document.getElementById("template-news-prices"),
    "template-guy": document.getElementById("template-guy"),
    "template-feedback-napkin": document.getElementById("template-feedback-napkin")
  },
  currentLocationElement: document.getElementById("currentLocation"),
  otherLocationElement: document.getElementById("otherLocation"),
  current: "storefront",
  other: "kitchen",
  themeName: document.getElementById("theme-name"),
  "storefront": {
    name: "STOREFRONT",
    element: document.getElementById("scene-storefront"),
    body: document.getElementById("scene-storefront-body"),
    news: document.getElementById("scene-storefront-news"),
    recipesList: document.getElementById("scene-recipes"),
    ministock: document.getElementById("storefront-ministock"),
    ministockTray: null,
    recipePreview: document.getElementById("recipe-preview"),
    recipePreviewContext: document.getElementById("recipe-preview").querySelector("canvas").getContext("2d"),
    day: {
      toggleButton: document.getElementById("day-toggle-button"),
      state: document.getElementById("day-state"),
      timer: document.getElementById("burgeria-timer"),
      icon: document.getElementById("burgeria-day-icon"),
      guysContainer: document.getElementById("guys-container"),
      overtimeMessage: document.getElementById("burgeria-overtime-message")
    },
  },
  "kitchen": {
    name: "KITCHEN",
    element: document.getElementById("scene-kitchen"),
    ingredientButtons: document.getElementById("ingredient-buttons"),
    library: {
      page: document.getElementById("library-page"),
      pagesTotal: document.getElementById("library-pages-total"),
      index: document.getElementById("library-index"),
      nav: document.getElementById("library-nav"),
      pageContainer: document.getElementById("library-page-container"),
      pageEmptyMessage: document.getElementById("library-page-empty")
    },
    inventoryList: document.getElementById("inventory-list"),
    lettersList: document.getElementById("letters-list"),
    workshop: document.getElementById("workshop-textarea"),
    pointsCounter: document.getElementById("points-counter"),
  },
  switchLocation: function() {
    let current = this.current;
    this.current = this.other;
    this.other = current;

    this.currentLocationElement.textContent = this[this.current].name;
    this.otherLocationElement.textContent = this[this.other].name;

    this[this.current].element.classList.remove("hidden");
    this[this.other].element.classList.add("hidden");

    sfx("click");
  }
};

// utility functions

function divContainingTemplate(templateId) {
  let div = document.createElement("div");
  let template = scenes.templates[templateId];
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

function toggleTheme(button) {
  playerdata.themes.index++;
  if (playerdata.themes.index > playerdata.themes.order.length - 1) playerdata.themes.index = 0;
  let name = playerdata.themes.order[playerdata.themes.index];
  let theme = playerdata.themes[name];

  for (let key in theme) {
    let value = theme[key];
    document.documentElement.style.setProperty("--"+key, value);
  }

  scenes.themeName.textContent = name;
}

function updateDayUI() {
  let dtb = scenes.storefront.day.toggleButton;
  let di = scenes.storefront.day.icon;
  let timer = scenes.storefront.day.timer;
  let state = scenes.storefront.day.state;
  let overtime = scenes.storefront.day.overtimeMessage;

  if (playerdata.storetime == -1) {
    let all_served = true;
    for (let guy of playerdata.guys) {
      if (!guy.served) {
        all_served = false;
        break;
      }
    }
    if (!all_served) {
      dtb.classList.add("disabled");
      di.textContent = "☾";
      overtime.classList.remove("gone");
    } else {
      dtb.classList.remove("disabled");
      di.textContent = "☼";
      overtime.classList.add("gone");
    }

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
      scenes.storefront.day.timer.classList.remove("transition");
    };
  }
}

function updatePoints() {
  scenes.kitchen.pointsCounter.textContent = playerdata.points;
}

function updateRecipes() {
  while (scenes.storefront.recipesList.lastElementChild) {
    scenes.storefront.recipesList.lastElementChild.remove();
  }

  let categories = {};

  for (let recipe of playerdata.recipes) {
    if (!(recipe.category in categories)) {
      categories[recipe.category] = [];
    }
    categories[recipe.category].push(recipe);
  }

  for (let name in categories) {
    const category = categories[name];
    let label = document.createElement("b");
    label.textContent = category[0].category.toUpperCase();
    let ul = document.createElement("ul");
    for (let recipe of category) {
      ul.appendChild(recipe.element);
    }
    scenes.storefront.recipesList.appendChild(label);
    scenes.storefront.recipesList.appendChild(ul);
  }
}

function updateMinistockWindow() {
  const ministock = scenes.storefront.ministock;

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
  let page = playerdata.library[playerdata.libraryIndex];

  if (page) {
    scenes.kitchen.library.page.textContent = page.text;

    scenes.kitchen.library.pageContainer.classList.remove("gone");
    scenes.kitchen.library.pageEmptyMessage.classList.add("gone");
  } else {
    scenes.kitchen.library.page.innerHTML = "<i>There are no words here.</i>";

    scenes.kitchen.library.pageContainer.classList.add("gone");
    scenes.kitchen.library.pageEmptyMessage.classList.remove("gone");
  }

  scenes.kitchen.library.pagesTotal.textContent = playerdata.library.length;
  scenes.kitchen.library.index.textContent = playerdata.libraryIndex + 1;

  let buttons = scenes.kitchen.library.nav.querySelectorAll("button");
  buttons[0].classList.add("disabled");
  buttons[1].classList.add("disabled");
  if (playerdata.library.length > 1) {
    if (playerdata.libraryIndex > 0) {
      buttons[0].classList.remove("disabled");
    }
    if (playerdata.libraryIndex < playerdata.library.length - 1) {
      buttons[1].classList.remove("disabled");
    }
  }
}

function navigateLibrary(value) {
  playerdata.libraryIndex += value;
  if (playerdata.libraryIndex < 0) playerdata.libraryIndex = 0;
  if (playerdata.libraryIndex >= playerdata.library.length) playerdata.libraryIndex = playerdata.library.length - 1;
  updateLibrary();
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

  return true;
}

// news

class headline {
  constructor(line1, line2) {
    let div = divContainingTemplate("template-news-headline");
    // let xbutton = div.querySelector("button");
    // xbutton.onclick = function() {
    //   let container = this.parentNode.parentNode;
    //   container.remove();
    // };
    div.classList.add("slide-up");
    scenes.storefront.news.prepend(div);

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

class prices {
  constructor() {
    let div = divContainingTemplate("template-news-prices");
    div.style.position = "relative";

    div.classList.add("slide-up");
    scenes.storefront.news.prepend(div);

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
