var mouse = {
    element: document.getElementById("mouse"),
    down: false
};

mouse.ondown = function(e) {
    mouse.down = true;
    mouse.element.classList.add("down");
}
mouse.onup = function(e) {
    mouse.down = false;
    mouse.element.classList.remove("down");
}
mouse.onmove = function(e) {
    let x = e.pageX;
    let y = e.pageY;

    mouse.element.style.left = x+"px";
    mouse.element.style.top = y+"px";

    var noselect = e.target && (e.target instanceof HTMLButtonElement || e.target.classList.contains("noselect"));
    var on_text = isPointOverText(x, y) || (e.target && e.target instanceof HTMLTextAreaElement);

    if (!noselect && on_text) {
        mouse.element.classList.add("text");
    } else {
        mouse.element.classList.remove("text");
    }
}

document.addEventListener("mousedown", mouse.ondown);
document.addEventListener("mouseup", mouse.onup);
window.addEventListener("blur", mouse.onup);
document.addEventListener("mousemove", mouse.onmove);

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