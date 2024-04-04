const container = document.getElementById("container");

var files = [];
var selectedFiles = [];
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
            if (e.button == 0) {
                if (this.readyToOpenWindow) {
                    this.openWindow(e);
                    mouse.onup(e);
                    e.stopPropagation();
                }
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
        if (e.button == 0) {
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
        } else {
            this.select(e, { noDrag: true });
        }
    }

    unselect() {
        if (selectedFiles.indexOf(this) == -1) return;

        this.unfocus();
        this.element.classList.remove("selected");
        selectedFiles.splice(selectedFiles.indexOf(this), 1);
        this.readyToOpenWindow = false;
    }

    select(e, p) {
        p = p || {};

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
        if (!p.noDrag) this.drag(e);
        this.focus();
    }

    focus() {
        this.element.classList.add("focused");
    }

    unfocus() {
        this.element.classList.remove("focused");
    }

    createGhost() {
        if (this.ghost) this.removeGhost();
        this.ghost = this.element.cloneNode(true);
        this.ghost.classList.add("ghost");
        container.appendChild(this.ghost);
    }

    removeGhost() {
        if (this.ghost) {
            this.ghost.remove();
            this.ghost = null;
        }
    }

    drag(e) {
        if (mouse.selecting) return;

        container.appendChild(this.element);
        this.offset = new Vector2(
            (parseFloat(this.element.style.left) || 0) - e.pageX,
            (parseFloat(this.element.style.top) || 0) - e.pageY
        );
        draggingFile = this;

        for (let file of selectedFiles) {
            file.element.classList.add("dragging");

            file.createGhost();
        }
    }

    cancelDrop() {
        if (mouse.selecting) return;

        if (draggingFile) {
            for (let file of selectedFiles) {
                file.element.classList.remove("dragging");
                file.removeGhost();
            }
            if (draggingFile == this) draggingFile = null;
        }
    }

    drop() {
        if (mouse.selecting) return;
        
        if (draggingFile) {
            for (let file of selectedFiles) {
                file.element.classList.remove("dragging");
    
                if (!file.ghost) file.createGhost();
                file.element.style.left = file.ghost.style.left;
                file.element.style.top = file.ghost.style.top;
                file.removeGhost();
            }
            if (draggingFile == this) draggingFile = null;
        }
    }

    openWindow(e) {
        this.readyToOpenWindow = false;

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
        this.window = new BurgeriaWindow(this);
    }

    delete() {
        if (this == draggingFile) draggingFile = null;
        this.removeGhost();
        this.unselect();
        this.element.remove();
        this.window.delete();
        files.splice(files.indexOf(this), 1);
    }
}

class Program extends File {
    constructor(x, y) {
        super(x, y);
        this.type = "program";
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
            if (e.button == 0) {
                if (!(e.target instanceof HTMLButtonElement)) {
                    this.focus();
                }
            }
        }.bind(this);

        var header = this.element.querySelector(".header");
        header.onmousedown = function(e) {
            if (e.button == 0) {
                if (!(e.target instanceof HTMLButtonElement)) {
                    this.drag(e);   
                }
            }
        }.bind(this);

        var x = this.element.querySelector(".close-button");
        x.onclick = function() {
            this.element.classList.add("closing");
        }.bind(this);

        this.element.onanimationend = function(e) {
            switch (e.animationName) {
                case "load-window":
                    this.element.classList.remove("loading");
                    break;
                case "stall":
                    this.element.classList.remove("focusing");
                    break;
                case "close-window":
                    this.element.classList.remove("closing");
                    this.close();
                    break;
            }
        }.bind(this);

        this.element.remove();
    }

    createElement() {
        this.element = createElementFromTemplate("editor-template");
        container.appendChild(this.element);
    }

    createGhost() {
        if (this.ghost) this.removeGhost();
        this.ghost = this.element.cloneNode(true);
        this.ghost.classList.add("ghost");
        container.appendChild(this.ghost);
    }

    updateGhost() {
        if (this.ghost) {
            var rect = this.element.getBoundingClientRect();
            this.ghost.style.width = rect.width+"px";
            this.ghost.style.height = rect.height+"px";
        }
    }

    removeGhost() {
        if (this.ghost) {
            this.ghost.remove();
            this.ghost = null;
        }
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

        this.createGhost();
    }

    drop() {
        this.element.classList.remove("dragging");
        this.offset = null;
        if (draggingWindow == this) draggingWindow = null;
        if (this.ghost) {
            this.setPosition(parseFloat(this.ghost.style.left), parseFloat(this.ghost.style.top));
            this.removeGhost();
            this.focus();
        }
    }

    unfocus() {
        if (selectedFiles.length > 0) {
            for (let file of selectedFiles) file.focus();
        }
        this.element.classList.remove("focused");
        if (focusedWindow == this) focusedWindow = null;
    }

    focus() {
        if (!this.element.classList.contains("focused")) {
            this.element.classList.add("focusing");
        }

        if (selectedFiles.length > 0) {
            for (let file of selectedFiles) file.unfocus();
        }
        if (focusedWindow && focusedWindow != this) {
            focusedWindow.element.classList.remove("focused");
        }
        focusedWindow = this;

        this.element.classList.add("focused");
        container.appendChild(this.element);
    }

    open(e) {
        if (!container.contains(this.element)) {
            this.element.classList.add("loading");
        }

        container.appendChild(this.element);
        this.focus();
        this.update();

        if (!this.position) {
            this.setPosition(e.pageX, e.pageY);
        }
    }

    close() {
        this.onclose();
        this.unfocus();
        this.drop();
        this.element.onmouseleave();
        this.element.remove();
    }
    onclose() { }

    setPosition(x, y) {
        let rect = this.element.getBoundingClientRect();
        // if (!container.contains(this.element)) {
        //     container.appendChild(this.element);
        //     rect = this.element.getBoundingClientRect();
        //     this.element.remove();
        // } else {
        //     rect = this.element.getBoundingClientRect();
        // }
        x = clamp(x || 0, 0, window.innerWidth - rect.width);
        y = clamp(y || 0, 0, window.innerHeight - rect.height);
        this.element.style.left = x+"px";
        this.element.style.top = y+"px";

        this.position = new Vector2(x, y);
    }

    update() { }

    delete() {
        this.close();
    }
}

document.addEventListener("mousedown", function(e) {
    mouse.ondown(e);
    
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
    mouse.onmove(e);

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
            newPosition.x = clamp(newPosition.x, file.element.clientWidth/2, window.innerWidth - file.element.clientWidth/2);
            newPosition.y = clamp(newPosition.y, file.element.clientHeight/2, window.innerHeight - file.element.clientHeight/2);

            if (!file.ghost) {
                file.createGhost();
            }
            file.ghost.style.left = newPosition.x + "px";
            file.ghost.style.top = newPosition.y + "px";

            if (file.readyToOpenWindow) {
                if (originalPosition.distanceTo(newPosition) > .5) {
                    file.readyToOpenWindow = false;
                }
            }
        }

        var w = getParentWithClass(e.target, "window");
        if (w) {
            container.appendChild(w);
        }
    }
});

function onmouseup(e) {
    mouse.onup(e);

    if (focusedWindow && !focusedWindow.element.classList.contains("hovered")) {
        focusedWindow.unfocus();
    }

    if (draggingWindow) {
        draggingWindow.drop();
    }

    if (selectedFiles.length > 0) {
        var on_window = elementInClass(e.target, "window");
        for (let i=selectedFiles.length-1; i>=0; i--) {
            let file = selectedFiles[i];
            if (on_window) {
                file.cancelDrop();
            } else {
                file.drop();
            }
        }
    }

    draggingFile = null;
}
document.addEventListener("mouseup", onmouseup);
window.addEventListener("blur", onmouseup);