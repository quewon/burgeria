var mouse = {
    element: document.getElementById("mouse"),
    down: false,
    selectionElement: document.getElementById("mouse-selection"),
    selecting: false,
    on_window: false,
    dropdown: document.querySelector(".dropdown")
};
mouse.selectionElement.remove();

mouse.ondown = function(e) {
    mouse.down = true;
    var on_window = elementInClass(e.target, "window");
    var on_dropdown = elementInClass(e.target, "dropdown");

    if (e.button == 0) {
        mouse.element.classList.add("down");

        if (!on_window && !on_dropdown) {
            mouse.selectionStart = new Vector2(e.pageX, e.pageY);
        }

        if (!on_dropdown) {
            mouse.dropdown.classList.add("gone");
        }
    } else if (e.button == 2) {
        if (!on_window) {
            var dropdown = mouse.dropdown;
            dropdown.classList.remove("gone");
            dropdown.style.left = e.pageX+"px";
            dropdown.style.top = e.pageY+"px";
        }
    }
}
mouse.onup = function(e) {
    mouse.down = false;
    mouse.element.classList.remove("down");
    mouse.selectionElement.remove();
    mouse.selectionStart = null;
    mouse.selecting = false;
    document.body.className = "";

    if (mouse.clearDropdownOnUp) {
        mouse.dropdown.classList.add("gone");
        mouse.clearDropdownOnUp = false;
    }
}
mouse.onmove = function(e) {
    let x = e.pageX;
    let y = e.pageY;

    mouse.element.style.left = x+"px";
    mouse.element.style.top = y+"px";

    if (draggingFile) {
        mouse.element.className = "down";
        document.body.className = "dragging";
    } else {
        var on_button = e.target && e.target instanceof HTMLButtonElement;
        var noselect = on_button || e.target && e.target.classList.contains("noselect");
        var on_text = isPointOverText(x, y) || (e.target && e.target instanceof HTMLTextAreaElement);

        if (!noselect && on_text) {
            mouse.element.classList.add("text");
        } else {
            mouse.element.classList.remove("text");
        }
    }

    if (mouse.down && !draggingFile && mouse.selectionStart) {
        if (!mouse.selecting) {
            document.body.appendChild(mouse.selectionElement);
            mouse.selecting = true;
        }

        mouse.selectionEnd = new Vector2(e.pageX, e.pageY);

        let start = mouse.selectionStart;
        let end = mouse.selectionEnd;

        let pos = new Vector2(
            Math.min(start.x, end.x),
            Math.min(start.y, end.y)
        );
        let size = new Vector2(
            Math.abs(end.x - start.x),
            Math.abs(end.y - start.y)
        );

        mouse.selectionElement.style.left = pos.x+"px";
        mouse.selectionElement.style.top = pos.y+"px";

        mouse.selectionElement.style.width = size.x+"px";
        mouse.selectionElement.style.height = size.y+"px";

        for (let file of files) {
            let w = file.element.clientWidth;
            let h = file.element.clientHeight;
            let x = parseFloat(file.element.style.left) - w/2;
            let y = parseFloat(file.element.style.top) - h/2;

            if (aabb(x, y, w, h, pos.x, pos.y, size.x, size.y)) {
                file.select(e);
            } else {
                file.unselect(e);
            }
        }
    }

    if (!mouse.dropdown.classList.contains("gone") && mouse.down) {
        var downPoint = new Vector2(
            parseFloat(mouse.dropdown.style.left), 
            parseFloat(mouse.dropdown.style.top)
        );
        if (downPoint.distanceTo(new Vector2(e.pageX, e.pageY)) > 5)
            mouse.clearDropdownOnUp = true;
    }
}

document.oncontextmenu = function(e) { e.preventDefault() };
window.addEventListener("blur", mouse.onup);

//https://stackoverflow.com/a/76328261
function isPointOverText(x, y) {
    const element = document.elementFromPoint(x, y);
    if (element == null) return false;
    const nodes = element.childNodes;
    for (let i = 0, node; (node = nodes[i++]); ) {
        if (node.nodeType === 3) {
            const range = document.createRange();
            range.selectNode(node);
            const rects = range.getClientRects();
            for (let j = 0, rect; (rect = rects[j++]); ) {
                if (
                    x > rect.left &&
                    x < rect.right &&
                    y > rect.top &&
                    y < rect.bottom
                ) {
                    if (node.nodeType === Node.TEXT_NODE) return true;
                }
            }
        }
    }
    return false;
}