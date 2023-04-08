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
    scenes.storefront.news.appendChild(div);

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

    // let xbutton = div.querySelector("button");
    // xbutton.onclick = function() {
    //   let container = this.parentNode.parentNode;
    //   container.remove();
    // };

    div.classList.add("slide-up");
    scenes.storefront.news.appendChild(div);

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

    let abcprices = gamedata.prices;
    let abc = "abcdefghijklmnopqrstuvwxyz";
    for (let i=0; i<abc.length; i++) {
      let char = abc[i];
      let label = document.createElement("span");
      label.textContent = char;
      label.style.textAlign = "center";
      label.style.gridColumnStart = i+2;
      label.style.gridRowStart = 2;
      graph.appendChild(label);

      let p = abcprices[char];
      let diff = p[p.length - 1] - p[p.length - 2];

      let bar = document.createElement("div");
      bar.style.height = p[p.length - 1]+"%";
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
        cbar.style.height = p[p.length - 2]+"%";
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
      tooltip.innerHTML = char+"<br><span class='burgerpoints'>BP</span> "+p[p.length-1];
      if (diff != 0) {
        tooltip.innerHTML += " <span style='color:"+(diff > 0 ? "var(--graph-positive)'>↑" : "var(--graph-negative)'>↓")+Math.abs(diff)+"</span>";
      }

      tooltip.className = "tooltip";
      hoverarea.appendChild(tooltip);

      hoverarea.addEventListener("mouseover", function() {
        this.firstElementChild.style.display = "block";
      });
      hoverarea.addEventListener("mouseout", function() {
        this.firstElementChild.style.display = "none";
      });

      graph.appendChild(hoverarea);
    }
  }
}

// kitchen stuff

var scenes = {
  currentLocationElement: document.getElementById("currentLocation"),
  otherLocationElement: document.getElementById("otherLocation"),
  current: "storefront",
  other: "kitchen",
  themeName: document.getElementById("theme-name"),
  "storefront": {
    name: "STOREFRONT",
    element: document.getElementById("scene-storefront"),
    body: document.getElementById("scene-storefront-body"),
    news: document.getElementById("scene-storefront-news")
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
  },
  switchLocation: function() {
    let current = this.current;
    this.current = this.other;
    this.other = current;

    this.currentLocationElement.textContent = this[this.current].name;
    this.otherLocationElement.textContent = this[this.other].name;

    this[this.current].element.classList.remove("hidden");
    this[this.other].element.classList.add("hidden");
  }
};

function updateLibrary() {
  let page = gamedata.library[gamedata.libraryIndex];

  if (page) {
    scenes.kitchen.library.page.textContent = page.text;

    scenes.kitchen.library.pageContainer.classList.remove("gone");
    scenes.kitchen.library.pageEmptyMessage.classList.add("gone");
  } else {
    scenes.kitchen.library.page.innerHTML = "<i>There are no words here.</i>";

    scenes.kitchen.library.pageContainer.classList.add("gone");
    scenes.kitchen.library.pageEmptyMessage.classList.remove("gone");
  }

  scenes.kitchen.library.pagesTotal.textContent = gamedata.library.length;
  scenes.kitchen.library.index.textContent = gamedata.libraryIndex + 1;

  let buttons = scenes.kitchen.library.nav.querySelectorAll("button");
  buttons[0].classList.add("disabled");
  buttons[1].classList.add("disabled");
  if (gamedata.library.length > 1) {
    if (gamedata.libraryIndex > 0) {
      buttons[0].classList.remove("disabled");
    }
    if (gamedata.libraryIndex < gamedata.library.length - 1) {
      buttons[1].classList.remove("disabled");
    }
  }
}

function navigateLibrary(value) {
  gamedata.libraryIndex += value;
  if (gamedata.libraryIndex < 0) gamedata.libraryIndex = 0;
  if (gamedata.libraryIndex >= gamedata.library.length) gamedata.libraryIndex = gamedata.library.length - 1;
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
  }
}
