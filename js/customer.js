import rules from "./rules.js";
import Word from "./word.js";
import { customers } from "./main.js";
import { sfx } from "./sound.js";

export default class Customer {
    static initial_r_scale = 2;

    constructor(x, y) {
        const menu_items = Object.keys(rules.recipes);
        this.face = ":)";
        this.state = "waiting";
        this.order = menu_items[Math.floor(Math.random() * menu_items.length)];
        this.x = x ?? Math.random() * 80 + 10;
        this.y = y ?? Math.random() * 80 + 10;
        this.r_scale = Customer.initial_r_scale;
        this.r = Word.char_width * this.r_scale;
        this.spawn();
        this.served_amount = 0;
    }

    grow() {
        this.r_scale += 1;
        this.r = Word.char_width * this.r_scale;
        this.element.style.width = (this.r * 2) + "%";
    }

    serve(word) {
        if (this.state == "served") return;

        var list = [];
        var cycle = word;
        while (cycle) {
            list.push(cycle.text);
            cycle = cycle.below;
        }
        const recipe_check = rules.recipes[this.order](list);

        if (recipe_check.success) {
            word.copy_to_gallery();
            word.remove();
            this.grow();
            this.element.classList.add("served");
            this.element.textContent = ":D";
            this.state = "served";
            if (recipe_check.message) {
                this.say(recipe_check.message + " +" + recipe_check.score);
            } else {
                this.say("thank you +" + recipe_check.score);
            }
            this.remove();

            customers.push(new Customer());
        } else {
            if (recipe_check.message)
                this.say(recipe_check.message);
            word.hide();
            this.face = ":/";
            this.element.textContent = this.face;
            this.served_amount++;
            setTimeout(() => {
                word.set_position(this.x - word.width/2, this.y + Word.char_height);
                word.push_down_colliding_words();
                word.show(); 
            }, 500);
            // if (this.served_amount == 5) {
            //     setTimeout(() => {
            //         this.say("never mind ...");
            //         this.remove();
            //     }, 500);
            // }
        }
    }

    remove() {
        this.element.classList.add("leaving");
        this.element.onanimationend = () => {
            this.element.remove();
        }
        customers.splice(customers.indexOf(this), 1);
    }

    spawn() {
        const element = document.createElement("button");
        element.className = "customer";
        element.textContent = this.face;
        element.style.top = this.y + "%";
        element.style.left = this.x + "%";
        element.style.width = (this.r * 2) + "%";
        kitchen_zone.appendChild(element);
        this.element = element;

        element.addEventListener("click", () => {
            if (this.dialogue.length > 0) {
                this.say(this.dialogue.shift())
            } else {
                // make noise
            }
        })

        sfx("chime");

        setTimeout(() => {
            this.say("can i have a " + this.order + " ?");
            this.dialogue = ["..."];
        }, 300);
    }

    say(text) {
        const width = Word.char_width * text.length;
        const height = Word.char_height;
        Word.spawn_string(this.x - width/2, this.y - height * 2, text, undefined, () => {
            sfx("talk")
        });

        switch (this.state) {
            case "waiting":
                this.dialogue = ["..."];
        }
    }

    static onresize() {
        for (let customer of customers) {
            customer.r = Word.char_width * customer.r_scale;
            customer.element.style.width = (customer.r * 2) + "%";
        }
    }
}

window.addEventListener("resize", Customer.onresize);