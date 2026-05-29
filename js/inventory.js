import { start_game } from "./main.js";
import { sfx } from "./sound.js";

var inventory = {};

for (let letter of "abcdefghijklmnopqrstuvwxyz") {
    inventory[letter] = 0;
    const element = document.createElement("span");
    element.className = "letter-" + letter;
    eat_zone.appendChild(element);
}

// setup
// let abc = "";
// for (let letter of "abcdefghijklmnopqrstuvwxyz") {
//     for (let i=0; i<2; i++)
//         abc += letter;
// }
// inventory_add(abc);

var game_start_flag = true;

function inventory_add(text) {
    for (const char of text) {
        const letter = char.toLowerCase();
        if (letter in inventory) {
            inventory[letter]++;
            setTimeout(() => {
                add_letter_element(letter);
                update_inventory_size();
                sfx("burgerpoints");
            }, Math.random() * 100);
        }
    }

    if (game_start_flag) {
        start_game();
        game_start_flag = false;
    }
}

function inventory_remove(text) {
    for (const char of text) {
        const letter = char.toLowerCase();
        if (letter in inventory) {
            inventory[letter]--;
            setTimeout(() => {
                remove_letter_element(letter);
                update_inventory_size();
            }, Math.random() * 100);
        }
    }
}

function add_letter_element(letter) {
    const element = document.createElement("span");
    element.textContent = letter;
    element.className = "consumable letter-" + letter;
    const letters = eat_zone.querySelectorAll(`.letter-${letter}`);
    const random_letter = letters[Math.floor(Math.random() * letters.length)];
    random_letter.after(element);
}

function remove_letter_element(letter) {
    const letters = eat_zone.querySelectorAll(`.consumable.letter-${letter}`);
    const random_letter = letters[Math.floor(Math.random() * letters.length)];
    if (random_letter) {
        random_letter.remove();
    }
}

async function update_inventory_size() {
    let low = 1, high = 500, best = 1;
    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        eat_zone.style.fontSize = mid + "px";
        if (eat_zone.scrollHeight <= eat_zone.clientHeight) {
            best = mid;
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    eat_zone.style.fontSize = best + "px";
}

window.addEventListener("resize", update_inventory_size);

export { inventory, inventory_add, inventory_remove, update_inventory_size };