const container = document.getElementById("container");

var selectedFile = null;
var draggingWindow = null;
var focusedWindow = null;

class File {
    constructor(x, y, data) {
        this.data = data || "";
        this.createElement(x, y);
        this.setName();
        this.createWindow();
    }

    setIcon(html) {
        this.icon.innerHTML = html;
    }

    createElement(x, y) {
        this.element = createElementFromTemplate("file-template");
        container.appendChild(this.element);

        this.element.onmousedown = this.mousedown.bind(this);
        this.element.onmouseup = function(e) {
            if (this.readyToOpenWindow) {
                this.openWindow(e);
                mouse.onup(e);
                e.stopPropagation();
            }
        }.bind(this);

        this.icon = this.element.querySelector(".icon");

        x = x || Math.random() * (window.innerWidth - 50) + 25;
        y = y || Math.random() * (window.innerHeight - 50) + 25;
        this.element.style.left = x+"px";
        this.element.style.top = y+"px";
    }

    setName(name) {
        this.name = name || "unnamed file";
        this.element.querySelector(".name").textContent = this.name;
    }

    mousedown(e) {
        this.select(e);
        mouse.ondown(e);
        e.stopPropagation();

        if (this.canDoubleClick) {
            this.readyToOpenWindow = true;
            return;
        }

        this.canDoubleClick = true;
        setTimeout(function() {
            this.canDoubleClick = false;
        }.bind(this), 500);
    }

    unselect() {
        this.unfocus();
        this.element.classList.remove("selected");
        selectedFile = null;
        this.readyToOpenWindow = false;
    }

    select(e) {
        if (selectedFile) selectedFile.unselect();
        this.element.classList.add("selected");
        selectedFile = this;
        this.drag(e);
        this.focus();
    }

    focus() {
        this.element.classList.add("focused");
    }

    unfocus() {
        this.element.classList.remove("focused");
    }

    drag(e) {
        container.appendChild(this.element);
        this.offset = new Vector2(
            (parseFloat(this.element.style.left) || 0) - e.pageX,
            (parseFloat(this.element.style.top) || 0) - e.pageY
        );
        this.dragging = true;
        this.element.classList.add("dragging");

        this.ghost = this.element.cloneNode(true);
        this.ghost.classList.add("ghost");
        container.appendChild(this.ghost);
    }

    drop() {
        this.dragging = false;
        this.element.classList.remove("dragging");

        this.element.style.left = this.ghost.style.left;
        this.element.style.top = this.ghost.style.top;
        this.ghost.remove();
    }

    openWindow(e) {
        this.drop();
        this.window.open(e);
    }

    createWindow() {
        this.window = new TextEditorWindow(this);
    }
}

class BurgeriaWindow {
    constructor(file) {
        this.file = file;

        this.createElement();

        this.element.onmouseenter = function() {
            this.classList.add("hovered");
        };
        this.element.onmouseleave = function() {
            this.classList.remove("hovered");
        };
        this.element.onmousedown = function(e) {
            if (!(e.target instanceof HTMLButtonElement)) {
                this.focus();
            }
        }.bind(this);

        var header = this.element.querySelector(".header");
        header.onmousedown = function(e) {
            if (!(e.target instanceof HTMLButtonElement)) {
                this.drag(e);   
            }
        }.bind(this);

        var x = this.element.querySelector(".close-button");
        x.onclick = this.close.bind(this);

        this.element.remove();
    }

    createElement() {
        this.element = createElementFromTemplate("editor-template");
        container.appendChild(this.element);
    }

    drag(e) {
        if (draggingWindow) draggingWindow.drop();
        draggingWindow = this;
        this.offset = new Vector2(
            (parseFloat(this.element.style.left) || 0) - e.pageX,
            (parseFloat(this.element.style.top) || 0) - e.pageY
        );
        this.element.classList.add("dragging");

        this.ghost = this.element.cloneNode(true);
        this.ghost.classList.add("ghost");
        container.appendChild(this.ghost);
    }

    drop() {
        this.element.classList.remove("dragging");
        this.offset = null;
        draggingWindow = null;

        if (this.ghost) {
            this.setPosition(parseFloat(this.ghost.style.left), parseFloat(this.ghost.style.top));
            this.ghost.remove();
            this.ghost = null;
            this.focus();
        }
    }

    unfocus() {
        if (selectedFile) selectedFile.focus();
        this.element.classList.remove("focused");
        focusedWindow = null;
    }

    focus() {
        if (selectedFile) selectedFile.unfocus();
        if (focusedWindow) {
            focusedWindow.element.classList.remove("focused");
        }
        focusedWindow = this;
        this.element.classList.add("focused");
        container.appendChild(this.element);
        this.onfocus();
    }
    onfocus() { }

    open(e) {
        if (!this.position) {
            this.setPosition(e.pageX, e.pageY);
        }
        container.appendChild(this.element);
        this.focus();
        this.update();
    }

    close() {
        this.element.remove();
        this.unfocus();
        this.drop();
        this.element.onmouseleave();
    }

    setPosition(x, y) {
        let rect = this.element.getBoundingClientRect();
        x = clamp(x || 0, 0, window.innerWidth - rect.width);
        y = clamp(y || 0, 0, window.innerHeight - rect.height);
        this.element.style.left = x+"px";
        this.element.style.top = y+"px";

        this.position = new Vector2(x, y);
    }

    update() { }
}

document.addEventListener("mousedown", function() {
    if (selectedFile) {
        selectedFile.unfocus();
        if (!focusedWindow || !focusedWindow.element.classList.contains("hovered")) {
            selectedFile.unselect();
        }
    }
});

document.addEventListener("mousemove", function(e) {
    if (draggingWindow) {
        let rect = draggingWindow.ghost.getBoundingClientRect();
        let x = e.pageX + draggingWindow.offset.x;
        let y = e.pageY + draggingWindow.offset.y;

        x = clamp(x || 0, 0, window.innerWidth - rect.width);
        y = clamp(y || 0, 0, window.innerHeight - rect.height);
        draggingWindow.ghost.style.left = x+"px";
        draggingWindow.ghost.style.top = y+"px";
    }

    if (selectedFile && selectedFile.dragging) {
        let rect = selectedFile.element.getBoundingClientRect();
        let x = e.pageX + selectedFile.offset.x;
        let y = e.pageY + selectedFile.offset.y;

        x = clamp(x, 0, window.innerWidth - rect.width);
        y = clamp(y, 0, window.innerHeight - rect.height);

        selectedFile.ghost.style.left = x + "px";
        selectedFile.ghost.style.top = y + "px";

        if (selectedFile.readyToOpenWindow) {
            var originalPosition = new Vector2(
                parseFloat(selectedFile.element.style.left),
                parseFloat(selectedFile.element.style.top),
            );
            var newPosition = new Vector2(x, y);
            if (originalPosition.distanceTo(newPosition) > .5) {
                selectedFile.readyToOpenWindow = false;
            }
        }
    }
});

function onmouseup(e) {
    if (focusedWindow && !focusedWindow.element.classList.contains("hovered")) {
        focusedWindow.unfocus();
    }

    if (draggingWindow) {
        draggingWindow.drop();
    }

    if (selectedFile) {
        selectedFile.drop();
    }
}
document.addEventListener("mouseup", onmouseup);
window.addEventListener("blur", onmouseup);