var INVENTORY_FILE;

class TextFile extends File {
    constructor(x, y, text) {
        super(x, y, text);
        this.type = "text";
    }
    
    createWindow() {
        this.window = new TextEditorWindow(this);
    }

    setName(name) {
        this.name = name || "untitled";
        this.element.querySelector(".name").textContent = this.name;
    }

    disintegrate(e) {
        if (this.sfxId) return;
        
        this.cancelDrop();

        this.window.body.disabled = "true";
        // this.openWindow(e);
        this.sfxId = sfx("disintegrate");

        this.disintegrateSpeed = 100;

        setTimeout(this.disintegrateTick.bind(this), this.disintegrateSpeed);
    }

    disintegrateTick() {
        if (this.data.trim().length == 0) {
            this.delete();
            sfx_stop("disintegrate", null, this.sfxId);
        } else {
            // container.appendChild(this.window.element);

            var i = this.data.length * Math.random() | 0;
            let char = this.data[i].toLowerCase();
            if (abc.includes(char)) {
                player.inventory[char]++;
                updateLettersLists();
            }

            this.data = this.data.substring(0, i) + this.data.substring(i+1);
            this.window.body.value = this.data;
            this.window.fitText();
            this.window.updateCharCount();
            this.window.updateTitle();

            this.disintegrateSpeed /= 1.03;

            setTimeout(this.disintegrateTick.bind(this), this.disintegrateSpeed);
        }
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
            this.file.data = this.body.value;
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

        this.body.addEventListener("focus", function() {
            this.body.scrollTop = this.savedScrollTop;
        }.bind(this));
        this.body.addEventListener("scroll", function() {
            this.savedScrollTop = this.body.scrollTop;
        }.bind(this));
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

        let linesPath = "M11 5.58142H25M4 5.58142H9M23 22.3256H25M4 22.3256H21M4 16.7442H12M14 16.7442H25M19 11.1628H25M4 11.1628H17";
        if (count == 0) {
            linesPath = "";
        }

        this.file.setIcon(
            `<svg width="33" height="40" viewBox="0 0 33 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="2.79071" width="30" height="37.2093" stroke="none"/>
            <rect x="0.5" y="0.5" width="29" height="36.2093" fill="white"/>
            <path d="`+linesPath+`" fill="none"/>
            </svg>`
        );
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

    onclose() {
        this.savedScrollTop = 0;
    }

    delete() {
        this.close();
        this.inputManager.delete();
    }
}

class InventoryFile extends Program {
    constructor(x, y) {
        super(x, y);
        this.setName("inventory");

        this.element.addEventListener("mouseenter", function() {
            if (draggingFile) {
                for (let file of selectedFiles) {
                    if (file.type != "text") {
                        return;
                    }
                }
                this.element.classList.add("dropzone");
            }
        }.bind(this));
        this.element.addEventListener("mouseleave", function() {
            this.element.classList.remove("dropzone");
        }.bind(this));
        this.element.addEventListener("mouseup", function(e) {
            if (this.element.classList.contains("dropzone")) {
                this.element.classList.remove("dropzone");
                for (let i=selectedFiles.length-1; i>=0; i--) {
                    selectedFiles[i].disintegrate(e);
                }
                this.window.open(e);
            }
        }.bind(this));
    };

    createWindow() {
        this.window = new InventoryWindow(this);
    }
}

class InventoryWindow extends BurgeriaWindow {
    constructor(file) {
        super(file);

        this.update();
    }

    createElement() {
        this.element = createElementFromTemplate("inventory-template");
        container.appendChild(this.element);
        this.table = this.element.querySelector("table");

        this.fileDropPrompt = this.element.querySelector(".file-drop-prompt");
        var body = this.element.querySelector(".body");
        body.addEventListener("mouseenter", function() {
            if (draggingFile) {
                for (let file of selectedFiles) {
                    if (file.type != "text") {
                        return;
                    }
                }
                this.fileDropPrompt.classList.add("visible");
            }
        }.bind(this));
        body.addEventListener("mouseleave", function() {
            this.fileDropPrompt.classList.remove("visible");
        }.bind(this));
        body.addEventListener("mouseup", function(e) {
            if (this.fileDropPrompt.classList.contains("visible")) {
                this.fileDropPrompt.classList.remove("visible");
                for (let i=selectedFiles.length-1; i>=0; i--) {
                    selectedFiles[i].disintegrate(e);
                }
            }
        }.bind(this));
    }

    update() {
        while (this.table.lastElementChild) {
            this.table.lastElementChild.remove();
        }

        var inventory_total = 0;
        var prominentChars = [];
        var highestCharAmount = 0;

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

                if (amount > highestCharAmount) {
                    highestCharAmount = amount;
                    prominentChars = [];
                }
                if (amount == highestCharAmount) {
                    prominentChars.push(char);
                }
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

        let prominentChar = "";
        let prominentCharY = 10;
        if (prominentChars.length > 0) {
            prominentChar = prominentChars[prominentChars.length * Math.random() | 0];

            // gets cut off
            if ("idjlkfbht".includes(prominentChar)) {
                prominentCharY = 13;
            }
            // could be higher
            if ("qpgy".includes(prominentChar)) {
                prominentCharY = 9;
            }
        }

        this.file.setIcon(
            `<svg width="32" height="37" viewBox="0 0 32 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 23.1363L9.86364 14.9545H31V26.5454L22.1364 34.7273H1V23.1363Z" fill="white" stroke="none"/>
            <path d="M1 23.1363L9.86364 14.9545H31M1 23.1363H22.1364M1 23.1363V34.7273H22.1364M22.1364 23.1363L31 14.9545M22.1364 23.1363V34.7273M31 14.9545V26.5454L22.1364 34.7273" fill="white"/>
            <text class="noselect" style="font-family: 'serif'; font-size: 20px" x="15" y="`+prominentCharY+`" stroke="none">`+prominentChar+`</text>
            </svg>`
        );

        if (this.ghost) {
            this.updateGhost();
        }
    }
}