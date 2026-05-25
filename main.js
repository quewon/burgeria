import rules from "./rules.js";
import Customer from "./customer.js";
import Word from "./word.js";
import { update_inventory_size } from "./inventory.js";
import InputManager from "./input.js";

var customers = [];
var mouse = { x: 0, y: 0 };
var words = [];

async function init() {
    await Word.onresize();
    update_inventory_size();

    kitchen_button.onclick = () => {
        kitchen_button.classList.add("selected");
        gallery_button.classList.remove("selected");
        kitchen_zone.classList.remove("hidden");
        gallery_zone.classList.add("hidden");
    }
    gallery_button.onclick = () => {
        kitchen_button.classList.remove("selected");
        gallery_button.classList.add("selected");
        kitchen_zone.classList.add("hidden");
        gallery_zone.classList.remove("hidden");
    }

    document.addEventListener("keydown", e => {
        if (e.target.tagName === "INPUT") return;

        if (e.key == "Delete" || e.key == "Backspace") {
            for (let i=words.length-1; i>=0; i--) {
                let word = words[i];
                if (word.grabbed) {
                    word.add_to_inventory();
                }
            }
            return;
        }
        if (e.ctrlKey || e.metaKey) return;
        if (kitchen_zone.classList.contains("hidden")) return;

        const input = document.createElement("input");
        new InputManager(input, "");

        input.type = "text";
        input.style.left = mouse.x + "%";
        input.style.top = mouse.y + "%";
        kitchen_zone.appendChild(input);
        input.focus();
        
        input.oninput = () => {
            input.size = Math.max(input.value.length, 1);
        }
        input.onblur = () => {
            const value = input.value.trim()
            if (value !== "") {
                let x = parseFloat(input.style.left);
                let y = parseFloat(input.style.top);
                for (let text of value.split(" ")) {
                    if (text == "") {
                        x += Word.char_width;
                        continue;
                    }
                    const word = new Word(x, y, text);
                    words.push(word);
                    const active_point = word.get_active_interaction_point();
                    if (active_point && active_point.type != "customer") {
                        word.interact(active_point);
                    }
                    x += (text.length + 1) * Word.char_width;
                }
            }
            input.remove();
        }

        input.addEventListener("keydown", e => {
            if (e.key === " " || e.key === "Enter") {
                const len = input.value.trim().length;
                input.blur();
                if (e.key === " ") {
                    mouse.x = parseFloat(input.style.left) + (len + 1) * Word.char_width;
                    mouse.y = parseFloat(input.style.top);
                } else if (e.key === "Enter") {
                    mouse.x = parseFloat(input.style.left);
                    mouse.y = parseFloat(input.style.top) + Word.char_height;
                }
            }
        })
    })

    document.addEventListener("mousemove", e => {
        mouse.x = (e.pageX - Word.textzone.x) / Word.textzone.width * 100;
        mouse.y = (e.pageY - Word.textzone.y) / Word.textzone.height * 100;
        mouse.y -= Word.char_height;
    })

    start_day();
}

function start_day() {
    customers.push(new Customer());
}

window.addEventListener("load", init);

export { words, customers };