var INVENTORY_FILE;
var WORLD_FILE;

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

    distill(e) {
        if (this.sfxId) return;
        
        this.cancelDrop();

        this.window.body.disabled = "true";
        // this.openWindow(e);
        this.sfxId = sfx("distill");

        this.distillSpeed = 100;
        setTimeout(this.distillTick.bind(this), this.distillSpeed);
    }

    distillTick() {
        if (this.data.trim().length == 0) {
            sfx_stop("distill", null, this.sfxId);
            this.delete();
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
            this.window.updateCharCount();
            this.window.updateTitle();
            this.window.fitText();

            this.distillSpeed /= 1.03;

            setTimeout(this.distillTick.bind(this), this.distillSpeed);
        }
    }
}

class TextEditorWindow extends BurgeriaWindow {
    constructor(file) {
        super(file);

        this.fitTestElement = document.createElement("div");
        this.fitTestElement.className = "textarea-test";

        this.inputManager = new InputManager(this.body, this.file.data, function() {
            this.updateCharCount();
            this.updateTitle();
            this.fitText();
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
        this.body.offsetWidth;

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

        if (this.file.sfxId && linesPath != "") {
            this.file.setIcon(
                `<svg width="38" height="43" viewBox="0 0 38 43" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="8" y="5.79071" width="30" height="37.2093" stroke="none"/>
                <rect x="5.5" y="3.5" width="29" height="36.2093" fill="white"/>
                <path d="M7 0.581421H21M0 0.581421H5M19 17.3256H21M0 17.3256H17M0 11.7442H8M10 11.7442H21M15 6.16282H21M0 6.16282H13" fill="none"/>
                </svg>`
            );
        } else {
            this.file.setIcon(
                `<svg width="33" height="40" viewBox="0 0 33 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="2.79071" width="30" height="37.2093" stroke="none"/>
                <rect x="0.5" y="0.5" width="29" height="36.2093" fill="white"/>
                <path d="`+linesPath+`" fill="none"/>
                </svg>`
            );
        }
    }

    updateTitle() {
        let title = this.body.value;
        title = title.replace(/[^A-Za-z\n ]/g, "").replace(/ +/, " ");
        title = title.trim().split("\n")[0];
        title = title.substring(0, 20);
        if (title == "") title = "untitled";
        this.title.textContent = title;
        this.file.setName(title);
    }

    onclose() {
        this.savedScrollTop = 0;
    }

    update() {
        this.fitText();
    }

    delete() {
        this.close();
        this.inputManager.delete();
    }
}

class InventoryFile extends Program {
    constructor(x, y) {
        super(x, y);
        this.setName("letters");

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
                    selectedFiles[i].distill(e);
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
                    selectedFiles[i].distill(e);
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

class WorldViewerFile extends Program {
    constructor(x, y) {
        super(x, y);
        this.setName("field");
        this.setIcon("<img src='res/window.jpeg' draggable='false'>")
    }

    createWindow() {
        this.window = new WorldWindow(this);
    }
}

class WorldWindow extends BurgeriaWindow {
    constructor(file) {
        super(file);
    }

    createElement() {
        this.element = createElementFromTemplate("world-viewer-template");
        container.appendChild(this.element);

        this.guysContainer = this.element.querySelector(".guys-container");
    }
}

class BurgerMakerFile extends Program {
    constructor(x, y) {
        super(x, y);
        this.setName("burgeria");
        this.setIcon(`<svg width="36" height="40" viewBox="0 0 36 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.7 8.09794C11.7 8.98019 12.3201 9.87267 13.5257 10.5724C14.7185 11.2647 16.3995 11.7089 18.2833 11.7089C20.1672 11.7089 21.8482 11.2647 23.041 10.5724C24.2466 9.87267 24.8667 8.98019 24.8667 8.09794L24.8667 8.09778C24.8668 8.09543 24.8678 8.07201 24.8239 8.01947C24.7738 7.95944 24.6789 7.88001 24.5172 7.79117C24.1924 7.61273 23.694 7.44771 23.0487 7.3098C21.7667 7.03587 20.0337 6.89514 18.2833 6.89514C16.533 6.89514 14.8 7.03587 13.518 7.3098C12.8727 7.44771 12.3743 7.61273 12.0495 7.79117C11.8878 7.88001 11.7929 7.95944 11.7428 8.01947C11.6989 8.07201 11.6999 8.09543 11.7 8.09778C11.7 8.09785 11.7 8.09791 11.7 8.09794Z" fill="white"/>
        <rect x="11.2" y="5.34863" width="14.1667" height="2.90686" rx="1" fill="white"/>
        <path d="M23.95 4.81082C23.95 3.35741 12.6167 3.35744 12.6167 4.81082C12.6167 6.2642 18.2833 8.4444 18.2833 8.4444C18.2833 8.4444 23.95 6.26424 23.95 4.81082Z" fill="white"/>
        <path d="M11.7 4.11092C11.7 3.22867 12.3201 2.3362 13.5257 1.63651C14.7185 0.944206 16.3995 0.5 18.2833 0.5C20.1672 0.5 21.8482 0.944206 23.041 1.63651C24.2466 2.3362 24.8667 3.22867 24.8667 4.11092L24.8667 4.11108C24.8668 4.11343 24.8678 4.13685 24.8239 4.1894C24.7738 4.24942 24.6789 4.32886 24.5172 4.4177C24.1924 4.59613 23.694 4.76115 23.0487 4.89906C21.7667 5.17299 20.0337 5.31373 18.2833 5.31373C16.533 5.31373 14.8 5.17299 13.518 4.89906C12.8727 4.76115 12.3743 4.59613 12.0495 4.4177C11.8878 4.32886 11.7929 4.24942 11.7428 4.1894C11.6989 4.13685 11.6999 4.11343 11.7 4.11108C11.7 4.11101 11.7 4.11096 11.7 4.11092Z" fill="white"/>
        <rect x="4.89999" y="12.1274" width="26.2" height="26.9059" fill="white"/>
        <path d="M18 21.1742V11.6274M18 21.1742C18 21.1742 18 25.5804 13.75 25.5804C9.5 25.5804 9.5 21.1742 9.5 21.1742M18 21.1742C18 21.1742 18 25.5804 22.25 25.5804C26.5 25.5804 26.5 21.1742 26.5 21.1742M18 11.6274H10.6333M18 11.6274H25.3667M9.5 21.1742C9.5 21.1742 9.5 25.5804 5.25 25.5804C1 25.5804 1 21.1742 1 21.1742L4.4 11.6274H10.6333M9.5 21.1742L10.6333 11.6274M26.5 21.1742C26.5 21.1742 26.5 25.5804 30.75 25.5804C35 25.5804 35 21.1742 35 21.1742L31.6 11.6274H25.3667M26.5 21.1742L25.3667 11.6274" fill="white"/>
        <path d="M17.4667 29.5686H18.5333C20.4663 29.5686 22.0333 31.1356 22.0333 33.0686V39.0333H13.9667V33.0686C13.9667 31.1356 15.5337 29.5686 17.4667 29.5686Z" fill="white"/>
        </svg>`);
    }

    createWindow() {
        this.window = new BurgerMakerWindow(this);
    }
}

class BurgerMakerWindow extends BurgeriaWindow {
    constructor(file) {
        super(file);
    }

    createElement() {
        this.element = createElementFromTemplate("burger-maker-template");
        container.appendChild(this.element);
    }
}