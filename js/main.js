import rules from "./rules.js";
import Customer from "./Customer.js";
import Word from "./Word.js";
import { inventory, inventory_remove, update_inventory_size } from "./inventory.js";
import InputManager from "./lib/input.js";
import { sfx } from "./sound.js";

var customers = [];
var words = [];
var input_manager;
var mouse = { x:0, y:0 };

async function init() {
    await Word.onresize();
    update_inventory_size();

    input_manager = new InputManager(input, "", () => {
        input.size = Math.max(input.value.length, 1);
    });
    input.size = 1;
    input.addEventListener("keydown", e => {
        if (e.key === " " || e.key === "Enter") {
            const len = input.value.trim().length;
            create_word_at_input();
            if (e.key === " ") {
                set_input_position(
                    parseFloat(input.style.left) + (len + 1) * Word.char_width,
                    parseFloat(input.style.top)
                );
            } else if (e.key === "Enter") {
                set_input_position(
                    parseFloat(input.style.left),
                    parseFloat(input.style.top) + Word.char_height
                );
            }
        }
    })

    kitchen_button.onclick = () => {
        kitchen_button.classList.add("selected");
        gallery_button.classList.remove("selected");
        kitchen_zone.classList.remove("hidden");
        gallery_zone.classList.add("hidden");
        Word.onresize();
    }
    gallery_button.onclick = () => {
        kitchen_button.classList.remove("selected");
        gallery_button.classList.add("selected");
        kitchen_zone.classList.add("hidden");
        gallery_zone.classList.remove("hidden");
    }

    document.addEventListener("mousedown", e => {
        create_word_at_input();
    })
    kitchen_zone.addEventListener("mouseup", e => {
        if (e.button !== 0 || e.target.closest(".word")) return;

        for (let word of words) {
            if (word.grabbed)
                return;
        }
        update_input_position();
        input.focus();
    })
    document.addEventListener("mousemove", e => {
        mouse = {
            x: (e.pageX - Word.textzone.x) / Word.textzone.width * 100,
            y: (e.pageY - Word.textzone.y) / Word.textzone.height * 100
        };
    })
    document.addEventListener("keydown", e => {
        if (e.target == input) return;

        update_input_position();
        input.focus();

        if (e.key == "Delete" || e.key == "Backspace") {
            var to_remove = [];
            for (let word of words) {
                if (word.grabbed && word.top() == word) {
                    to_remove.push(word);
                }
            }
            for (let word of to_remove) {
                word.add_to_inventory();
            }
            input.blur();
            return;
        }
    })

    Word.spawn_string(5, Word.char_height * 1, "eat words by dragging them off");
    Word.spawn_string(5, Word.char_height * 2, "type to make new words");
    Word.spawn_string(5, Word.char_height * 3, "drag + select 2 or more words to");

    const g_make_groups = [];
    const w_make = new Word(5 + Word.char_width * 33, Word.char_height * 3, "make");
    const w_groups = new Word(5 + Word.char_width * 38, Word.char_height * 3, "groups");

    words.push(w_make);
    words.push(w_groups);
    w_make.add_to_group(g_make_groups);
    w_groups.add_to_group(g_make_groups);

    Word.spawn_string(5 + Word.char_width * 8, Word.char_height * 5, "to build burgers");

    const g_stack_words = [];
    const w_stack = new Word(5, Word.char_height * 4, "stack");
    const w_words = new Word(5 + Word.char_width * 2, Word.char_height * 5, "words");

    words.push(w_stack);
    words.push(w_words);
    w_stack.add_to_group(g_stack_words);
    w_words.add_to_group(g_stack_words);
}

function create_word_at_input() {
    const text = input.value.trim();
    if (text != "") {
        const word = new Word(
            parseFloat(input.style.left),
            parseFloat(input.style.top),
            text
        );
        words.push(word);
        sfx("type");
    }
    input_manager.burn();
}

function update_input_position() {
    set_input_position(mouse.x, mouse.y);
}

function set_input_position(x, y) {
    input.style.left = x + "%";
    input.style.top = y + "%";
}

function start_game() {
    setTimeout(() => {
        customers.push(new Customer(50, 50, "burger"));
    }, 1000);
}

window.addEventListener("load", init);

export { words, customers, start_game };