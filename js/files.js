var INVENTORY_FILE;

class TextFile extends File {
    constructor(x, y, text) {
        super(x, y, text);

        this.setIcon(
            `<svg width="33" height="40" viewBox="0 0 33 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="2.79071" width="30" height="37.2093" stroke="none"/>
            <rect x="0.5" y="0.5" width="29" height="36.2093" fill="white"/>
            <path d="M11 5.58142H25M4 5.58142H9M23 22.3256H25M4 22.3256H21M4 16.7442H12M14 16.7442H25M19 11.1628H25M4 11.1628H17" fill="none"/>
            </svg>`
        );
    }
    
    createWindow() {
        this.window = new TextEditorWindow(this);
    }

    setName(name) {
        this.name = name || "untitled";
        this.element.querySelector(".name").textContent = this.name;
    }
}

class TextEditorWindow extends BurgeriaWindow {
    constructor(file) {
        super(file);

        this.fitTestElement = document.createElement("div");
        this.fitTestElement.className = "textarea-test";

        this.inputManager = new InputManager(this.body, this.file.data, function() {
            this.fitText();
            this.updateCharCount();
            this.updateTitle();
        }.bind(this));
        
        container.appendChild(this.element);

        this.updateCharCount();
        this.updateTitle();
        this.fitText();
        
        this.element.remove();
    }

    createElement() {
        this.element = createElementFromTemplate("editor-template");
        container.appendChild(this.element);

        this.body = this.element.querySelector("textarea");
        this.counter = this.element.querySelector(".char-counter");
        this.title = this.element.querySelector(".title");

        this.element.querySelector(".inventory-button").onclick = function(e) {
            INVENTORY_FILE.window.open(e);
            let rect = this.element.getBoundingClientRect();
            INVENTORY_FILE.window.setPosition(rect.left + rect.width + 5, rect.top);
        }.bind(this);
    }
    
    fitText() {
        var div = this.fitTestElement;
        div.className = "textarea-test";
        div.style.width = this.body.clientWidth+"px";
        div.textContent = this.body.value+" ";
        container.appendChild(div);
        var height = div.clientHeight;

        this.body.style.height = "auto";
        this.body.style.height = height+"px";
    }

    updateCharCount() {
        let count = ""+letterCount(this.body.value);
        while (count.length < 3) count = "0"+count;
        this.counter.textContent = count;
    }

    updateTitle() {
        let title = this.body.value.trim().toLowerCase();
        title = title.split("\n")[0];
        title = title.replace(/[^a-z ]/g, "").replace(/ +/, " ");
        title = title.substring(0, 10);
        if (title == "") title = "untitled";
        this.title.textContent = title;
        this.file.setName(title);
    }

    onfocus() {
        setTimeout(function() {
            if (document.activeElement != this.body)
                focusOnContenteditable(this.body);
        }.bind(this), 1);
    }
}

class InventoryFile extends File {
    constructor(x, y) {
        super(x, y);
        this.setName("inventory");
        this.setIcon(
            `<svg width="32" height="36" viewBox="0 0 32 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 23.1363L9.86364 14.9545H31V26.5454L22.1364 34.7273H1V23.1363Z" fill="white" stroke="none"/>
            <path d="M1 23.1363L9.86364 14.9545H31M1 23.1363H22.1364M1 23.1363V34.7273H22.1364M22.1364 23.1363L31 14.9545M22.1364 23.1363V34.7273M31 14.9545V26.5454L22.1364 34.7273" fill="white"/>
            <text class="noselect" style="font-family: 'serif'; font-size: 20px" x="15" y="10" stroke="none">a</text>
            </svg>`
        )
    };

    createWindow() {
        this.window = new InventoryWindow();
    }
}

class InventoryWindow extends BurgeriaWindow {
    constructor(file) {
        super(file);
    }

    createElement() {
        this.element = createElementFromTemplate("inventory-template");
        container.appendChild(this.element);
        this.table = this.element.querySelector("table");
    }

    update() {
        while (this.table.lastElementChild) {
            this.table.lastElementChild.remove();
        }

        var inventory_total = 0;

        for (let char in player.inventory) {
            let amount = player.inventory[char];
            if (amount > 0) {
                let tr = document.createElement("tr");
                let th = document.createElement("th");
                let td = document.createElement("td");
                th.textContent = char;
                td.textContent = amount;
                tr.appendChild(th);
                tr.appendChild(td);
                this.table.appendChild(tr);

                inventory_total += amount;
            }
        }

        let tr = document.createElement("tr");
        let th = document.createElement("td");
        let td = document.createElement("td");
        th.textContent = "total";
        td.textContent = inventory_total;
        tr.appendChild(th);
        tr.appendChild(td);
        this.table.appendChild(tr);
    }
}