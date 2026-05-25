function drag(p) {
    const mousemove = e => {
        if (p.ondrag) p.ondrag(e);
    }
    const mouseup = e => {
        if (p.ondragend) p.ondragend(e);
        document.body.classList.remove("grabbing");
        document.removeEventListener("mousemove", mousemove);
        document.removeEventListener("mouseup", mouseup);
        window.removeEventListener("blur", mouseup);
    }
    document.body.classList.add("grabbing");
    document.addEventListener("mousemove", mousemove);
    document.addEventListener("mouseup", mouseup);
    window.addEventListener("blur", mouseup);
}

export { drag };