class Guy {
    constructor(x, y) {
        this.element = document.createElement("div");
        var faces = [
            ":)", ":(",
            ":D",
            ":P",
            ";)", ";(",
            ":,)", ":,(",
            ":v",
            ":s",
            ":L",
            ":O",
            ":o",
            ":I",
            ":x",
            ":B",
            ":3",
            ":3)", ":3(",
            "d:)", "d:(",
            "B)", "B(",
            "8)", "8(",
            "x)", "x(",
            "xD",
        ];
        let face = faces[faces.length * Math.random() | 0];
        this.element.textContent = face;
        this.element.className = "guy noselect";

        let win = STOREFRONT_FILE.window;
        win.guysContainer.appendChild(this.element);

        this.setPosition(x, y);
    }

    createElement() {

    }

    setPosition(x, y) {
        this.position = new Vector2(x || 50, y || 50);
        this.element.style.left = this.position.x+"%";
        this.element.style.top = this.position.y+"%";
    }
}