import { words, customers } from "./main.js";
import { inventory_add } from "./inventory.js";
import { drag } from "./dragdrop.js";
import { sfx } from "./sound.js";

function distance(x1, y1, x2, y2) {
    let dx = x2 - x1;
    let dy = y2 - y1;
    return (dx * dx + dy * dy);
}

function point_in_circle(x, y, cx, cy, r) {
    return (Math.sqrt(distance(x, y, cx, cy)) <= r);
}

function aabb(x1, w1, y1, h1, x2, w2, y2, h2) {
    return (
        x1 < x2 + w2 &&
        x1 + w1 > x2 &&
        y1 < y2 + h2 &&
        y1 + h1 > y2
    )
}

export default class Word {
    static char_width = 0;
    static char_height = 0;
    static textzone = {
        x: 0,
        y: 0,
        width: 0,
        height: 0
    }

    constructor(x = 0, y = 0, text = "") {
        this.layer = kitchen_zone;
        this.group = null;
        this.width = text.length * Word.char_width;
        this.height = Word.char_height;
        this.text = text;
        this.spawn_element();
        this.set_position(x, y);
    }

    spawn_element() {
        var element = document.createElement("div");
        element.textContent = this.text;
        element.className = "word new";
        element.onanimationend = () => {
            element.onanimationend = null;
            element.classList.remove("new");
        }
        kitchen_zone.appendChild(element);
        this.element = element;

        element.addEventListener("mouseover", this.hover.bind(this))
        element.addEventListener("mouseleave", this.unhover.bind(this))
        element.addEventListener("mousedown", e => {
            if (e.button == 2) {
                this.add_to_inventory();
                return;
            }

            if (this.grabbed) {
                this.grabbed_before_drag = true;
                for (let word of words) {
                    if (word.is_head() && word.grabbed) {
                        word.grabbed_before_drag = true;
                        word.start_dragging(e);
                    }
                }
            } else {
                for (let word of words) {
                    if (word.is_head())
                        word.ungrab();
                }
                this.grab();
                this.start_dragging(e);
            }
        })
    }

    is_head() {
        if (this.group) {
            return this.group.indexOf(this) == 0;
        }
        return true;
    }

    push_colliding_words() {
        if (!this.is_head()) return;
        const heads = words.filter(word => (
            word.layer == this.layer &&
            !word.is_attached_to(this) &&
            aabb(
                this.x, this.width, this.y, this.height,
                word.x, word.width, word.y, word.height
            )
        ));
        heads.sort((a, b) => {
            return a.y + a.height/2 < b.y + b.height/2
        })
        for (let word of heads) {
            if (word.y + word.height/2 < this.y + this.height/2) {
                word.set_position(word.x, this.y - word.height);
                word.push_colliding_words();
            } else {
                word.set_position(word.x, this.y + this.height);
                word.push_colliding_words();
            }
        }
    }

    set_group_position(x, y) {
        const box = this.get_group_bounds()
        for (let word of this.group) {
            const rel = {
                x: word.x - box.x,
                y: word.y - box.y
            }
            word.set_position(x + rel.x, y + rel.y);
        }
    }

    set_position(x, y) {
        this.x = x;
        this.y = y;
        this.element.style.left = x + "%";
        this.element.style.top = y + "%";
        if (this.group) {
            this.group[0].update_group_element();
        }
    }

    get_active_word_interaction_point() {
        const interaction_points = this.get_interaction_points();
        const active_points = interaction_points.filter(point => {
            if (point.type != "customer") {
                let word = point.type == "above" ? this.bottom() : this;
                return aabb(
                    word.x, word.width, word.y, word.height, 
                    point.x, point.width, point.y, point.height
                );
            }
        })
        const active_sorted = active_points.sort((a, b) => {
            let a_word = a.type == "above" ? this.bottom() : this;
            let a_overlap = {
                min: {
                    x: Math.max(a_word.x, a.x),
                    y: Math.max(a_word.y, a.y)
                },
                max: {
                    x: Math.min(a_word.x + a_word.width, a.x + a.width),
                    y: Math.min(a_word.y + a_word.height, a.y + a.height)
                }
            }
            if (a_overlap.max.x < a_overlap.min.x || a_overlap.max.y < a_overlap.min.y)
                return 1;
            let a_intersect_area = 
                (a_overlap.max.x - a_overlap.min.x) * 
                (a_overlap.max.y - a_overlap.min.y);
            let a_area = a.width * a.height;
            let a_coverage = a_intersect_area / a_area;

            let b_word = b.type == "above" ? this.bottom() : this;
            let b_overlap = {
                min: {
                    x: Math.max(b_word.x, b.x),
                    y: Math.max(b_word.y, b.y)
                },
                max: {
                    x: Math.min(b_word.x + b_word.width, b.x + b.width),
                    y: Math.min(b_word.y + b_word.height, b.y + b.height)
                }
            }
            if (b_overlap.max.x < b_overlap.min.x || b_overlap.max.y < b_overlap.min.y)
                return -1;
            let b_intersect_area = 
                (b_overlap.max.x - b_overlap.min.x) * 
                (b_overlap.max.y - b_overlap.min.y);
            let b_area = b.width * b.height;
            let b_coverage = b_intersect_area / b_area;

            return b_coverage - a_coverage;
        })
        if (active_sorted.length > 0) {
            return active_sorted[0];
        }
        return null;
    }

    start_dragging(e) {
        const down_state = {
            mouse: { x: e.pageX, y: e.pageY },
            element: {
                x: this.x / 100 * Word.textzone.width,
                y: this.y / 100 * Word.textzone.height
            }
        }

        const interaction_field = document.createElement("div");
        interaction_field.className = "interaction-point";

        this.active_interaction_point = null;
        
        const ondrag = e => {
            let mouse_delta = {
                x: e.pageX - down_state.mouse.x,
                y: e.pageY - down_state.mouse.y
            }
            const x = (down_state.element.x + mouse_delta.x) / Word.textzone.width * 100;
            const y = (down_state.element.y + mouse_delta.y) / Word.textzone.height * 100;
            if (this.group) {
                const box = this.get_group_bounds();
                const rel = {
                    x: box.x - this.x,
                    y: box.y - this.y
                }
                this.set_group_position(x + rel.x, y + rel.y);
            } else {
                this.set_position(x, y);
            }
            if (
                e.pageX < Word.textzone.x ||
                e.pageX > Word.textzone.x + Word.textzone.width ||
                e.pageY < Word.textzone.y ||
                e.pageY > Word.textzone.y + Word.textzone.height
            ) {
                document.body.classList.add("might-eat");
            } else {
                document.body.classList.remove("might-eat");
            }
        }
        ondrag(e);
        
        drag({
            ondrag,
            ondragend: e => {
                interaction_field.remove();
                if (!this.grabbed_before_drag) {
                    this.ungrab();
                }

                document.body.classList.remove("might-eat");
                for (let element of document.querySelectorAll(".might-attach"))
                    element.classList.remove("might-attach");
                for (let element of document.querySelectorAll(".might-serve"))
                    element.classList.remove("might-serve");

                if (
                    e.pageX < Word.textzone.x ||
                    e.pageX > Word.textzone.x + Word.textzone.width ||
                    e.pageY < Word.textzone.y ||
                    e.pageY > Word.textzone.y + Word.textzone.height
                ) {
                    this.add_to_inventory();
                }
            }
        })
    }

    hide() {
        if (this.group && this.is_head()) {
            for (let word of this.group) {
                word.element.style.display = "none";
            }
            this.group_element.style.display = "none";
        } else {
            this.element.style.display = "none";
        }
    }

    show() {
        if (this.group && this.is_head()) {
            for (let word of this.group) {
                word.element.style.display = "block";
            }
            this.group_element.style.display = "block";
        } else {
            this.element.style.display = "block";
        }
    }

    remove() {
        if (this.group && this.is_head()) {
            for (let word of this.group) {
                word.element.remove();
                words.splice(words.indexOf(word), 1);
            }
            this.group_element.remove();
        } else {
            this.element.remove();
            words.splice(words.indexOf(this), 1);
        }
    }

    add_to_inventory() {
        if (this.group && this.is_head()) {
            for (let word of this.group) {
                inventory_add(word.text);
            }
        } else {
            inventory_add(this.text);
        }
        this.remove();
    }

    grab(only_self) {
        if (!only_self && this.group) {
            for (let word of this.group) {
                word.grabbed = true;
                word.element.classList.add("grab");
            }
        } else {
            this.grabbed = true;
            this.element.classList.add("grab");
        }
    }

    ungrab(only_self) {
        if (!only_self && this.group) {
            this.grabbed_before_drag = false;
            for (let word of this.group) {
                word.grabbed = false;
                word.element.classList.remove("grab");
            }
        } else {
            this.grabbed = false;
            this.grabbed_before_drag = false;
            this.element.classList.remove("grab");
        }
    }

    hover() {
        if (this.group) {
            for (let word of this.group) {
                word.element.classList.add("hover");
            }
        } else {
            this.element.classList.add("hover");
        }
    }

    unhover() {
        if (this.group) {
            for (let word of this.group) {
                word.element.classList.remove("hover");
            }
        } else {
            this.element.classList.remove("hover");
        }
    }

    add_to_group(group) {
        if (this.group) {
            this.group.splice(this.group.indexOf(this), 1);
            if (this.group_element)
                this.group_element.remove();
            if (this.group.length <= 1) {
                const word = this.group[0];
                word.group = null;
                if (word.group_element)
                    word.group_element.remove();
            } else {
                if (!this.group[0].group_element)
                    this.group[0].spawn_group_element();
                this.group[0].update_group_element();
            }
        }
        group.push(this);
        if (group.length == 1) {
            this.spawn_group_element();
        }
        this.group = group;
        group[0].update_group_element();
    }

    is_attached_to(word) {
        if (word == this) return true;
        if (!word.group || !this.group) return false;
        return word.group.indexOf(this) != -1;
    }

    get_group_bounds() {
        let min = { x: this.x, y: this.y }
        let max = { x: this.x + this.width, y: this.y + this.height }
        for (let word of this.group) {
            min.x = Math.min(min.x, word.x);
            min.y = Math.min(min.y, word.y);
            max.x = Math.max(max.x, word.x + word.width);
            max.y = Math.max(max.y, word.y + word.height);
        }
        return { x: min.x, y: min.y, width: max.x - min.x, height: max.y - min.y }
    }

    spawn_group_element() {
        if (this.group_element) this.group_element.remove();
        const element = document.createElement("div");
        element.className = "word-group";
        this.layer.appendChild(element);
        this.group_element = element;
    }

    update_group_element() {
        const { x, y, width, height } = this.get_group_bounds();
        this.group_element.style.left = x + "%";
        this.group_element.style.top = y + "%";
        this.group_element.style.width = width + "%";
        this.group_element.style.height = height + "%";
    }

    interact(point) {
        if (!point) return;
        if (point.type == "customer") {
            point.customer.serve(this);
            sfx("burgerpoints");
        } else if (point.type == "insert") {
            this.add_to_group(point.word.group);
            sfx("drop");
        }
    }

    get_interaction_points() {
        var points = [];
        search: for (let word of words) {
            if (
                word.layer == this.layer &&
                word.is_head() &&
                !word.is_attached_to(this) &&
                word.group
            ) {
                const { x, y, width, height } = word.get_group_bounds();
                points.push({
                    type: "insert",
                    word,
                    x, y, width, height
                })
            }
        }
        for (let customer of customers) {
            points.push({
                type: "customer",
                customer,
                x: customer.x,
                y: customer.y,
                r: customer.r
            })
        }
        return points;
    }

    copy_to_gallery() {
        const { x, y, width, height } = this.get_group_bounds();

        const padding = Word.char_width;
        var pos_x = 0;
        var pos_y = 0;

        var xs = [padding];
        var ys = [padding];
        var gallery_boxes = [];
        for (let word of words) {
            if (word.layer == gallery_zone && word.is_head()) {
                if (word.group) {
                    const w_box = word.get_group_bounds();
                    gallery_boxes.push(w_box);
                    xs.push(w_box.x + w_box.width + padding);
                    ys.push(w_box.y + w_box.height + padding);
                } else {
                    gallery_boxes.push(word);
                    xs.push(word.x + word.width + padding);
                    ys.push(word.y + word.height + padding);
                }
            }
        }
        xs = xs.sort((a, b) => a - b);
        ys = ys.sort((a, b) => a - b);

        get_pos: for (const cy of ys) {
            for (const cx of xs) {
                if (cx + width > 100 - padding) continue;
                const candidate = { x: cx, y: cy, w: width, h: height };
                if (!gallery_boxes.some(b => aabb(
                    cx, cy, width, height,
                    b.x, b.y, b.width, b.height
                ))) {
                    pos_x = cx;
                    pos_y = cy;
                    break get_pos;
                }
            }
        }

        if (this.group) {
            var group;
            for (let word of this.group) {
                const copy = new Word(
                    word.x - x + pos_x,
                    word.y - y + pos_y,
                    word.text
                )
                copy.layer = gallery_zone;
                words.push(copy);
                if (!group) {
                    copy.group = [copy];
                } else {
                    group.push(copy);
                    copy.group = group;
                }
            }
        } else {
            const copy = new Word(pos_x, pos_y, this.text);
            copy.layer = gallery_zone;
            words.push(copy);
        }

        gallery_button.classList.remove("hidden");
    }

    static async spawn_string(x = 0, y = 0, string = "", delay = 0, onspawn) {
        for (let text of string.split(" ")) {
            const word = new Word(x, y, text);
            word.push_colliding_words();
            words.push(word);
            x += (text.length + 1) * Word.char_width;
            if (onspawn) onspawn();
            await new Promise(resolve => {
                setTimeout(() => {
                    resolve()
                }, text.length * delay);
            })
        }
    }

    static async onresize() {
        const context = document.createElement("canvas").getContext("2d");
        const font_size = getComputedStyle(document.body).getPropertyValue("font-size");
        context.font = `${font_size} 'Atkinson Hyperlegible Mono'`;
        await document.fonts.load(context.font).then(() => {
            let mm = context.measureText("0");
            const char_width = mm.width;
            const char_height = mm.fontBoundingBoxAscent + mm.fontBoundingBoxDescent;
            Word.char_width = char_width / kitchen_zone.clientWidth * 100;
            Word.char_height = char_height / kitchen_zone.clientHeight * 100;
        });

        if (!kitchen_zone.classList.contains("hidden")) {
            Word.textzone = {
                x: main_zone.offsetLeft - main_zone.clientWidth/2,
                y: main_zone.offsetTop - main_zone.clientHeight/2 + kitchen_zone.offsetTop,
                width: kitchen_zone.clientWidth,
                height: kitchen_zone.clientHeight
            }
        }

        if (words) {
            for (let word of words) {
                word.width = word.text.length * Word.char_width;
                word.height = Word.char_height;
            }
            for (let word of words) {
                if (word.group_element)
                    word.update_group_element();
            }
        }
    }
}

var selection_area;
document.addEventListener("mousedown", e => {
    if (
        e.target.closest("button") ||
        e.target.closest(".word") || 
        e.target.closest(".customer")
    ) return;

    if (!selection_area) {
        selection_area = document.createElement("div");
        selection_area.id = "selection-area";
    }
    selection_area.style.left = e.pageX + "px";
    selection_area.style.top = e.pageY + "px";
    selection_area.style.width = 0;
    selection_area.style.height = 0;
    document.body.appendChild(selection_area);

    const down_state = {
        x: e.pageX,
        y: e.pageY
    }
    document.body.classList.add("selecting");

    for (let word of words) {
        if (word.is_head())
            word.ungrab();
    }

    drag({
        ondrag: e => {
            for (let word of words) {
                word.ungrab(true);
            }

            let min = {
                x: Math.min(down_state.x, e.pageX),
                y: Math.min(down_state.y, e.pageY)
            };
            let max = {
                x: Math.max(down_state.x, e.pageX),
                y: Math.max(down_state.y, e.pageY)
            };
            selection_area.style.left = min.x + "px";
            selection_area.style.top = min.y + "px";
            selection_area.style.width = (max.x - min.x) + "px";
            selection_area.style.height = (max.y - min.y) + "px";

            min = {
                x: (min.x - Word.textzone.x) / Word.textzone.width * 100,
                y: (min.y - Word.textzone.y) / Word.textzone.height * 100,
            }
            max = {
                x: (max.x - Word.textzone.x) / Word.textzone.width * 100,
                y: (max.y - Word.textzone.y) / Word.textzone.height * 100,
            }
            for (let word of words) {
                if (
                    !kitchen_zone.classList.contains("hidden") && word.layer == gallery_zone ||
                    !gallery_zone.classList.contains("hidden") && word.layer == kitchen_zone
                ) continue;
                if (aabb(
                    min.x, max.x - min.x, min.y, max.y - min.y,
                    word.x, word.width, word.y, word.height
                )) {
                    word.grab(true);
                }
            }
        },
        ondragend: e => {
            const selected_words = words.filter(word => word.grabbed);
            if (selected_words.length > 1) {
                const group = [];
                for (let word of selected_words) {
                    word.add_to_group(group);
                }
            }

            document.body.classList.remove("selecting");
            selection_area.remove();
        }
    })
})

document.addEventListener("contextmenu", e => {
    e.preventDefault();
})

window.addEventListener("resize", Word.onresize);