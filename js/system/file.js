const container = document.getElementById("container");

var files = [];
var selectedFiles = [];
var draggingFiles = false;
var draggingFile = null;
var draggingWindow = null;
var focusedWindow = null;

class File {
    constructor(x, y, data) {
        this.data = data || "";
        this.createElement(x, y);
        this.setName();
        this.createWindow();

        files.push(this);
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

        if (!mouse.selecting) {
            this.canDoubleClick = true;
            setTimeout(function() {
                this.canDoubleClick = false;
            }.bind(this), 500);
        }
    }

    unselect() {
        if (selectedFiles.indexOf(this) == -1) return;

        this.unfocus();
        this.element.classList.remove("selected");
        selectedFiles.splice(selectedFiles.indexOf(this), 1);
        this.readyToOpenWindow = false;
    }

    select(e) {
        if (!mouse.selecting && selectedFiles.indexOf(this) == -1) {
            for (let i=selectedFiles.length-1; i>=0; i--) {
                let file = selectedFiles[0];
                file.unselect();
            }
        }

        this.element.classList.add("selected");
        if (selectedFiles.indexOf(this) == -1) {
            selectedFiles.push(this);
        }
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
        if (mouse.selecting) return;

        container.appendChild(this.element);
        this.offset = new Vector2(
            (parseFloat(this.element.style.left) || 0) - e.pageX,
            (parseFloat(this.element.style.top) || 0) - e.pageY
        );
        draggingFiles = true;
        draggingFile = this;

        for (let file of selectedFiles) {
            file.dragging = true;
            file.element.classList.add("dragging");

            file.ghost = file.element.cloneNode(true);
            file.ghost.classList.add("ghost");
            container.appendChild(file.ghost);
        }
    }

    drop() {
        if (mouse.selecting) return;
        
        if (draggingFiles) {
            for (let file of selectedFiles) {
                file.dragging = false;
                file.element.classList.remove("dragging");
    
                file.element.style.left = file.ghost.style.left;
                file.element.style.top = file.ghost.style.top;
                file.ghost.remove();
            }
        }

        draggingFiles = false;
        draggingFile = null;
    }

    openWindow(e) {
        let d = new Vector2(
            e.pageX - parseFloat(this.element.style.left),
            e.pageY - parseFloat(this.element.style.top)
        );

        for (let file of selectedFiles) {
            file.drop();

            if (file == this) {
                
            } else {
                file.window.open({
                    pageX: parseFloat(file.element.style.left) + d.x,
                    pageY: parseFloat(file.element.style.top) + d.y,
                });
            }
        }

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

        e.stopPropagation();

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
        if (selectedFiles.length > 0) {
            for (let file of selectedFiles) file.focus();
        }
        this.element.classList.remove("focused");
        focusedWindow = null;
    }

    focus() {
        if (selectedFiles.length > 0) {
            for (let file of selectedFiles) file.unfocus();
        }
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

document.addEventListener("mousedown", function(e) {
    var on_file = elementInClass(e.target, "file");
    if (on_file) return;

    if (selectedFiles.length > 0) {
        let unselect = !focusedWindow || !focusedWindow.element.classList.contains("hovered");

        for (let i=selectedFiles.length-1; i>=0; i--) {
            let file = selectedFiles[i];
            if (unselect) {
                file.unselect();
            } else {
                file.unfocus();
            }
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

    if (draggingFile) {
        let x = e.pageX + draggingFile.offset.x;
        let y = e.pageY + draggingFile.offset.y;
        let movement = new Vector2(
            x - parseFloat(draggingFile.element.style.left),
            y - parseFloat(draggingFile.element.style.top),
        );

        for (let file of selectedFiles) {
            var originalPosition = new Vector2(
                parseFloat(file.element.style.left),
                parseFloat(file.element.style.top),
            );
            var newPosition = new Vector2(
                originalPosition.x + movement.x,
                originalPosition.y + movement.y
            );
            newPosition.x = clamp(newPosition.x, 0, window.innerWidth - file.element.clientWidth);
            newPosition.y = clamp(newPosition.y, 0, window.innerHeight - file.element.clientHeight);

            file.ghost.style.left = newPosition.x + "px";
            file.ghost.style.top = newPosition.y + "px";

            if (file.readyToOpenWindow) {
                if (originalPosition.distanceTo(newPosition) > .5) {
                    file.readyToOpenWindow = false;
                }
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

    if (selectedFiles.length > 0) {
        for (let i=selectedFiles.length-1; i>=0; i--) {
            let file = selectedFiles[i];
            file.drop();
        }
    }
}
document.addEventListener("mouseup", onmouseup);
window.addEventListener("blur", onmouseup);