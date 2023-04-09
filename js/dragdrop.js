var _dragdrop = {
  itemInHand: null,
  mouse: { x:0, y:0 }
};

init_dragdrop();

function init_dragdrop() {
  window.addEventListener("mousemove", function(e) {
    let x = e.pageX;
    let y = e.pageY;
    _dragdrop.mouse.x = x;
    _dragdrop.mouse.y = y;

    let item = _dragdrop.itemInHand;
    if (!item) return;

    let ghost = item.dragGhost;
    ghost.style.left = x+"px";
    ghost.style.top = y+"px";
  });

  function mouseup() {
    let grabbing = document.querySelector(".grabbing");
    if (grabbing) grabbing.classList.remove("grabbing");

    let item = _dragdrop.itemInHand;
    if (item) {
      item.drop();
    }
  }
  window.addEventListener("mouseup", mouseup);
  window.addEventListener("blur", mouseup);
}
