import { words, customers } from "./main.js";
import { inventory_add } from "./inventory.js";
import { drag } from "./dragdrop.js";

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
        this.above = null;
        this.below = null;
        this.width = text.length * Word.char_width;
        this.height = Word.char_height;
        this.text = text;
        this.spawn_element();
        this.set_position(x, y);
    }

    get_bounding_box() {
        let min = { x: this.x, y: this.y };
        let max = { x: this.x + this.width, y: this.y + this.height };
        let below = this.below;
        while (below) {
            min.x = Math.min(below.x, min.x);
            min.y = Math.min(below.y, min.y);
            max.x = Math.max(below.x + below.width, max.x);
            max.y = Math.max(below.y + below.height, max.y);
            below = below.below;
        }
        return { x: min.x, y: min.y, width: max.x - min.x, height: max.y - min.y }
    }

    push_down_colliding_words() {
        if (this.top() != this) return;
        const box = this.get_bounding_box();
        for (let word of words) {
            if (
                word.layer != this.layer || 
                word.is_attached_to(this) || 
                word.top() != word
            ) continue;
            const w_box = word.get_bounding_box();
            if (aabb(
                box.x, box.width, box.y, box.height,
                w_box.x, w_box.width, w_box.y, w_box.height
            )) {
                word.set_position(word.x, box.y + box.height);
                word.push_down_colliding_words();
            }
        }
    }

    push_up_colliding_words() {
        if (this.top() != this) return;
        const box = this.get_bounding_box();
        for (let word of words) {
            if (
                word.layer != this.layer || 
                word.is_attached_to(this) || 
                word.top() != word
            ) continue;
            const w_box = word.get_bounding_box();
            if (aabb(
                box.x, box.width, box.y, box.height,
                w_box.x, w_box.width, w_box.y, w_box.height
            )) {
                word.set_position(word.x, box.y - w_box.height);
                word.push_up_colliding_words();
            }
        }
    }

    set_position(x, y) {
        if (
            this.below &&
            this.below.x !== undefined && this.below.y !== undefined
        ) {
            let delta = {
                x: x - this.x,
                y: y - this.y
            }
            this.below.set_position(this.below.x + delta.x, this.below.y + delta.y);
        }
        this.x = x;
        this.y = y;
        this.element.style.left = x + "%";
        this.element.style.top = y + "%";
        if (this.group_element) this.update_group_element();
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
                    if (word.grabbed) {
                        word.grabbed_before_drag = true;
                        if (word.top() != word) continue;
                        word.start_dragging(e);
                    }
                }
            } else {
                for (let word of words) {
                    word.ungrab();
                }
                this.grab();
                this.start_dragging(e);
            }
        })
    }

    start_dragging(e) {
        const down_state = {
            mouse: { x: e.pageX, y: e.pageY },
            element: {
                x: this.x / 100 * Word.textzone.width,
                y: this.y / 100 * Word.textzone.height
            }
        }

        if (this.above) this.detach_above();

        const interaction_field = document.createElement("div");
        interaction_field.className = "interaction-point";

        var active_interaction_point;
        
        const ondrag = e => {
            let mouse_delta = {
                x: e.pageX - down_state.mouse.x,
                y: e.pageY - down_state.mouse.y
            }
            this.set_position(
                (down_state.element.x + mouse_delta.x) / Word.textzone.width * 100,
                (down_state.element.y + mouse_delta.y) / Word.textzone.height * 100
            );
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

            const interaction_points = this.get_interaction_points();

            for (let point of interaction_points) {
                if (point.type == "customer") {
                    point.customer.element.textContent = point.customer.face;
                    point.customer.element.classList.remove("might-serve");
                } else {
                    var unattached = [point.word];
                    if (point.type == "insert") {
                        var cycle = point.word.below;
                        while (cycle) {
                            unattached.push(cycle);
                            cycle = cycle.below;
                        }
                    }
                    for (let unattached_word of unattached) {
                        let word_that_might_attach = null;
                        for (let word of words) {
                            if (word.grabbed) {
                                if (word.get_active_interaction_point()?.word == unattached_word) {
                                    word_that_might_attach = word;
                                }
                            }
                        }
                        if (!word_that_might_attach) {
                            unattached_word.element.classList.remove("might-attach");
                        }
                    }
                }
            }

            const mouse = {
                x: e.pageX - Word.textzone.x,
                y: e.pageY - Word.textzone.y,
            }
            
            active_interaction_point = null;
            const active_points = interaction_points.filter(point => {
                if (point.type == "customer") {
                    return (point_in_circle(
                        mouse.x, mouse.y,
                        point.customer.element.offsetLeft,
                        point.customer.element.offsetTop,
                        point.customer.element.clientWidth/2
                    ))
                } else {
                    let word = point.type == "above" ? this.bottom() : this;
                    return aabb(
                        word.x, word.width, word.y, word.height, 
                        point.x, point.width, point.y, point.height
                    );
                }
            })
            const active_sorted = active_points.sort((a, b) => {
                if (a.type == "customer" && b.type == "customer") {
                    return (
                        distance(
                            e.pageX, e.pageY,
                            a.customer.x / 100 * Word.textzone.width,
                            a.customer.y / 100 * Word.textzone.height
                        )
                        - distance(
                            e.pageX, e.pageY,
                            b.customer.x / 100 * Word.textzone.width,
                            b.customer.y / 100 * Word.textzone.height
                        )
                    )
                } else if (a.type == "customer" || b.type == "customer") {
                    if (a.type == "customer") return -1;
                    return 1;
                }
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
                active_interaction_point = active_sorted[0];
            }
            if (active_interaction_point) {
                const point = active_interaction_point;
                if (point.type == "customer") {
                    interaction_field.remove();
                    point.customer.element.textContent = ":O";
                    point.customer.element.classList.add("might-serve");
                } else if (point.type == "insert") {
                    let word = point.word;
                    while (word) {
                        word.element.classList.add("might-attach");
                        word = word.below;
                    }
                    interaction_field.style.left = point.x + "%";
                    interaction_field.style.top = point.y + "%";
                    interaction_field.style.width = point.width + "%";
                    interaction_field.style.height = point.height + "%";
                    this.layer.appendChild(interaction_field);
                } else {
                    point.word.element.classList.add("might-attach");
                    const box = this.get_bounding_box();
                    const p_box = point.word.get_bounding_box();
                    const min = {
                        x: Math.min(box.x, p_box.x),
                        y: Math.min(box.y, p_box.y)
                    }
                    const max = {
                        x: Math.min(box.x + box.width, p_box.x + p_box.width),
                        y: Math.min(box.y + box.height, p_box.y + p_box.height)
                    }
                    interaction_field.style.left = min.x + "%";
                    interaction_field.style.top = min.y + "%";
                    interaction_field.style.width = (max.x - min.x) + "%";
                    interaction_field.style.height = (max.y - min.y) + "%";
                    this.layer.appendChild(interaction_field);
                }
            } else {
                interaction_field.remove();
            }
        }
        ondrag(e);
        
        drag({
            ondrag,
            ondragend: e => {
                interaction_field.remove();
                if (!this.grabbed_before_drag)
                    this.ungrab();
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
                    return;
                }

                if (active_interaction_point) {
                    this.interact(active_interaction_point);
                }
            }
        })
    }

    hide() {
        this.element.style.display = "none";
        if (this.group_element)
            this.group_element.style.display = "none";
        if (this.below)
            this.below.hide()
    }

    show() {
        this.element.style.display = "block";
        if (this.below)
            this.below.show()
        if (this.group_element) {
            this.group_element.style.display = "block";
            this.update_group_element();
        }
    }

    remove() {
        this.element.remove();
        if (this.above) {
            this.detach_above();
        }
        if (this.below) {
            this.below.remove();
        }
        words.splice(words.indexOf(this), 1);
    }

    add_to_inventory() {
        let word = this;
        while (word) {
            inventory_add(word.text);
            word = word.below;
        }
        this.remove();
    }

    grab() {
        this.grabbed = true;
        this.element.classList.add("grab");
        if (this.below) {
            this.below.grab();
        }
    }

    ungrab() {
        this.grabbed = false;
        this.grabbed_before_drag = false;
        this.element.classList.remove("grab");
        if (this.below) {
            this.below.ungrab();
        }
    }

    hover() {
        this.element.classList.add("hover");
        if (this.below) {
            this.below.hover();
        }
    }

    unhover() {
        this.element.classList.remove("hover");
        if (this.below) {
            this.below.unhover();
        }
    }

    attach_below(word) {
        if (this.below && this.below != word) {
            this.below.detach_above();
            this.detach_below();
        }
        this.below = word;
        if (word.above != this)
            word.attach_above(this)
        if (!this.above) {
            this.spawn_group_element();
        } else {
            let top = this.above;
            while (top.above)
                top = top.above;
            top.update_group_element();
        }
    }

    attach_above(word) {
        if (this.above && this.above != word) {
            this.above.detach_below();
            this.detach_above();
        }
        this.above = word;
        if (word.below != this)
            word.attach_below(this)
        if (this.group_element) {
            this.group_element.remove();
            this.group_element = null;
        }
    }

    spawn_group_element() {
        if (this.group_element)
            this.group_element.remove();
        const element = document.createElement("div");
        element.className = "word-group";
        this.layer.appendChild(element);
        this.group_element = element;
        this.update_group_element();
    }

    update_group_element() {
        const { x, y, width, height } = this.get_bounding_box();
        this.group_element.style.left = x + "%";
        this.group_element.style.top = y + "%";
        this.group_element.style.width = width + "%";
        this.group_element.style.height = height + "%";
    }

    detach_below() {
        const prev_below = this.below;
        this.below = null;
        if (prev_below?.above == this)
            prev_below.detach_above()
        if (this.above) {
            let top = this.above;
            while (top.above)
                top = top.above;
            top.update_group_element();
        } else if (this.group_element) {
            this.group_element.remove();
            this.group_element = null;
        }
    }

    detach_above() {
        const prev_above = this.above;
        this.above = null;
        if (prev_above?.below == this)
            prev_above.detach_below()
        if (this.below) {
            this.spawn_group_element();
        }
    }

    get_active_interaction_point() {
        const points = this.get_interaction_points();
        for (let point of points) {
            let word = point.type == "below" ? this : this.bottom()
            if (aabb(
                word.x, word.width, word.y, word.height,
                point.x, point.width, point.y, point.height
            )) {
                return point;
            }
        }
    }

    interact(point) {
        if (point.type == "customer") {
            point.customer.serve(this);
        } else if (point.type == "insert") {
            let insert_after = point.word.bottom();
            while (this.y < insert_after?.y) {
                insert_after = insert_after.above;
            }
            if (!insert_after) {
                this.set_position(this.x, point.y - Word.char_height);
                this.attach_below(point.word);
            } else {
                this.set_position(this.x, insert_after.y + Word.char_height);
                if (insert_after.below) {
                    let bottom = this.bottom();
                    insert_after.below.set_position(insert_after.below.x, bottom.y + Word.char_height);
                    bottom.attach_below(insert_after.below);
                }
                this.attach_above(insert_after);
            }
        } else {
            if (point.type == "below") {
                this.set_position(this.x, point.y);
                this.attach_above(point.word);
            } else {
                let tiers = 0;
                let bottom = this;
                while (bottom.below) {
                    tiers++;
                    bottom = bottom.below;
                }
                this.set_position(this.x, point.y - tiers * Word.char_height);
                bottom.attach_below(point.word);
            }
        }
    }

    bottom() {
        let bottom = this;
        while (bottom.below)
            bottom = bottom.below;
        return bottom;
    }

    top() {
        let top = this;
        while (top.above)
            top = top.above;
        return top;
    }

    is_attached_to(word) {
        let check = this.top();
        while (check) {
            if (check == word) return true;
            check = check.below;
        }
        return false;
    }

    attached_words() {
        let words = [];
        let word = this.top();
        while (word) {
            words.push(word);
            word = word.below;
        }
        return words;
    }

    get_interaction_points() {
        var points = [];
        search: for (let word of words) {
            if (word.layer != this.layer) continue;
            if (word == this || word.is_attached_to(this)) continue;
            if (word.grabbed) continue;
            if (word.bottom() == word) {
                points.push({
                    type: "below",
                    word,
                    x: word.x,
                    y: word.y + Word.char_height,
                    width: word.width,
                    height: Word.char_height
                })
            }
            if (word.top() == word) {
                points.push({
                    type: "above",
                    word,
                    x: word.x,
                    y: word.y - Word.char_height,
                    width: word.width,
                    height: Word.char_height
                })

                if (word.group_element) {
                    const { x, y, width, height } = word.get_bounding_box();
                    points.push({
                        type: "insert",
                        word,
                        x, y, width, height
                    })
                }
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
        const { x, y, width, height } = this.get_bounding_box();

        const padding = Word.char_width;
        var pos_x = 0;
        var pos_y = 0;

        var xs = [padding];
        var ys = [padding];
        var gallery_boxes = [];
        for (let word of words) {
            if (word.layer == gallery_zone && word.top() == word) {
                const w_box = word.get_bounding_box();
                gallery_boxes.push(w_box);
                xs.push(w_box.x + w_box.width);
                ys.push(w_box.y + w_box.height);
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

        // const gallery_was_hidden = gallery_zone.classList.contains("hidden");
        // kitchen_zone.classList.add("hidden");
        // gallery_zone.classList.remove("hidden");

        var word = this;
        var previous_copy;
        while (word) {
            const copy = new Word(
                word.x - x + pos_x, 
                word.y - y + pos_y, 
                word.text
            );
            copy.layer = gallery_zone;
            words.push(copy);
            if (previous_copy) {
                previous_copy.attach_below(copy);
            }
            gallery_zone.appendChild(copy.element);
            word = word.below;
            previous_copy = copy;
        }

        // if (gallery_was_hidden) {
        //     kitchen_zone.classList.remove("hidden");
        //     gallery_zone.classList.add("hidden");
        // }

        gallery_button.classList.remove("hidden");
    }

    static async spawn_string(x = 0, y = 0, string = "", delay = 30) {
        for (let text of string.split(" ")) {
            const word = new Word(x, y, text);
            word.push_up_colliding_words();
            words.push(word);
            x += (text.length + 1) * Word.char_width;
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
        if (word.grabbed) {
            word.ungrab();
        }
    }

    drag({
        ondrag: e => {
            for (let word of words) {
                if (word.grabbed) {
                    word.ungrab();
                }
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
                if (word.top() != word) continue;
                let { x, y, width, height } = word.get_bounding_box();
                if (aabb(
                    min.x, max.x - min.x, min.y, max.y - min.y,
                    x, width, y, height
                )) {
                    word.grab();
                }
            }
        },
        ondragend: e => {
            document.body.classList.remove("selecting");
            selection_area.remove();
        }
    })
})

document.addEventListener("contextmenu", e => {
    e.preventDefault();
})

window.addEventListener("resize", Word.onresize);