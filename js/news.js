class MarketAlert {
  constructor() {
    let div = divContainingTemplate("market-alert");
    ui.storefront.news.appendChild(div);
    div.classList.add("temp");
  }
}

class Headline {
  constructor(line1, line2) {
    let div = divContainingTemplate("news-headline");
    ui.storefront.news.appendChild(div);

    let l1 = div.querySelector("[name='line1']");
    let l2 = div.querySelector("[name='line2']");

    if (line1) l1.textContent = line1;
    if (line2) l2.textContent = line2;

    const sceneHidden = ui.scenes.storefront.classList.contains("hidden");
    if (sceneHidden) ui.scenes.storefront.classList.remove("hidden");
    this.squeeze(l1.parentNode);
    this.squeeze(l2.parentNode);
    if (sceneHidden) ui.scenes.storefront.classList.add("hidden");
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
    let div = divContainingTemplate("news-prices");
    div.style.position = "relative";

    ui.storefront.news.appendChild(div);

    //

    let graph = div.querySelector(".prices-graph");
    let pointsholder = div.querySelector(".points-holder");
    let points = ["0", ".25", ".5", ".75", "1"];
    let divrect = div.getBoundingClientRect();
    for (let point of points) {
      let label = document.createElement("span");
      label.textContent = point;
      label.className = "graphvaluepoint";
      label.style.bottom = (Number(point) * 100)+"%";
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
      bar.style.height = (currentPrice * 100)+"%";
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
        cbar.style.height = (previousPrice * 100)+"%";
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
      tooltip.innerHTML = char+"<br><span class='burgerpoints'></span>"+currentPrice.toFixed(2);
      if (diff != 0) {
        diff = diff.toFixed(2);
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
