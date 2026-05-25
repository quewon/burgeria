import rules from "./rules.js";
import Customer from "./customer.js";
import Word from "./word.js";
import { inventory, inventory_remove, update_inventory_size } from "./inventory.js";
import InputManager from "./lib/input.js";
import { sfx } from "./sound.js";

var customers = [];
var words = [];
var input_manager;

async function init() {
    await Word.onresize();
    update_inventory_size();

    input_manager = new InputManager(input, "", () => {
        input.size = Math.max(input.value.length, 1);
    });
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
        if (e.target.closest(".word")) return;

        for (let word of words) {
            if (word.grabbed)
                return;
        }
        set_input_position(
            (e.pageX - Word.textzone.x) / Word.textzone.width * 100,
            (e.pageY - Word.textzone.y) / Word.textzone.height * 100
        );
        input.focus();
    })

    document.addEventListener("keydown", async e => {
        if (e.target == input && input.value != "") return;

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
        if (e.ctrlKey || e.metaKey) {
            if (e.code == "KeyA") {
                for (let word of words) {
                    if (
                        kitchen_zone.classList.contains("hidden") && word.layer == kitchen_zone ||
                        gallery_zone.classList.contains("hidden") && word.layer == gallery_zone
                    ) {
                        continue;
                    }
                    word.grab();
                }
            } else if (e.code == "KeyC") {
                e.preventDefault();

                var selected = [];
                var x = 0;
                var y = 0;
                for (let word of words) {
                    if (word.grabbed) {
                        selected.push({
                            text: word.text,
                            x: word.x,
                            y: word.y
                        })
                        x = Math.min(x, word.x);
                        y = Math.min(y, word.y);
                    }
                }
                for (let selection of selected) {
                    selection.line_index = Math.floor((selection.y - y) / Word.char_height);
                    selection.char_index = Math.floor((selection.x - x) / Word.char_width);
                }
                selected.sort((a, b) => {
                    if (a.line_index != b.line_index) {
                        return a.line_index - b.line_index;
                    } else {
                        return a.char_index - b.char_index;
                    }
                })

                var text = "";
                var char_index = 0;
                var previous_line = selected[0].line_index;
                for (let selection of selected) {
                    if (selection.line_index > previous_line) {
                        previous_line = selection.line_index;
                        text += "\n";
                        char_index = 0;
                    }
                    for (let i=char_index; i<selection.char_index; i++) {
                        text += " ";
                    }
                    text += selection.text;
                    char_index = selection.char_index + selection.text.length;
                }
                
                navigator.clipboard.writeText(text);
            } else if (e.code == "KeyV") {
                e.preventDefault();

                var text = await navigator.clipboard.readText();
                for (let i=0; i<text.length; i++) {
                    if (text[i] == " " || text[i] == "\n") continue;
                    const letter = text[i].toLowerCase();
                    if (letter in inventory && inventory[letter] > 0) continue;
                    text = text.substring(0, i) + " " + text.substring(i + 1);
                }
                inventory_remove(text);
                if (text.trim() == "") {
                    sfx("error");
                    document.body.classList.add("letter-rejected");
                    setTimeout(() => {
                        document.body.classList.remove("letter-rejected");
                    }, 100);
                    return;
                }

                const input_x = parseFloat(input.style.left) || 0;
                let x = input_x;
                let y = parseFloat(input.style.top) || 0;
                let lines = text.split("\n");
                for (let i=0; i<lines.length; i++) {
                    let line = lines[i];
                    let linewords = line.split(" ");
                    for (let j=0; j<linewords.length; j++) {
                        let lineword = linewords[j];
                        if (lineword == "") {
                            x += Word.char_width;
                            continue;
                        }
                        const word = new Word(x, y, linewords[j]);
                        words.push(word);
                        x += Word.char_width * word.text.length;
                        if (j < linewords.length - 1) {
                            x += Word.char_width;
                        }
                    }
                    if (i < lines.length - 1) {
                        y += Word.char_height;
                        x = input_x;
                    }
                }
                set_input_position(x, y);
            }
            input.blur();
            return;
        }
    })

    Word.spawn_string(5, Word.char_height * 1, "eat words by dragging them off", 0);
    Word.spawn_string(5, Word.char_height * 2, "type anywhere to make words", 0);
    Word.spawn_string(5 + Word.char_width * 8, Word.char_height * 4, "to build burgers", 0);

    words.push(new Word(5, Word.char_height * 3, "stack"))
    const word = new Word(5 + Word.char_width * 2, Word.char_height * 4, "words", 0);
    words.push(word);
    word.interact(word.get_active_word_interaction_point());
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
        // word.interact(word.get_active_word_interaction_point());
    }
    input_manager.burn();
}

function set_input_position(x, y) {
    input.style.left = x + "%";
    input.style.top = y + "%";
}

function start_day() {
    setTimeout(() => {
        customers.push(new Customer(50, 50));
    }, 1000);
}

window.addEventListener("load", init);

export { words, customers, start_day };