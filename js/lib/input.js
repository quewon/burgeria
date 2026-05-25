import { inventory, inventory_add, inventory_remove } from "../inventory.js";
import { sfx } from "../sound.js";

const ABC = "abcdefghijklmnopqrstuvwxyz";

class InputState {
    constructor(text, selectionStart, selectionEnd, addedText, deletedText) {
        this.text = text || "";
        this.selectionStart = selectionStart || 0;
        this.selectionEnd = selectionEnd || 0;
        this.addedText = addedText || "";
        this.deletedText = deletedText || "";
    }
}

export default class InputManager {
    constructor(inputElement, text, oninput) {
        this.element = inputElement;
        if (oninput) this.oninput = oninput;

        this.history = [];
        this.historyIndex = -1;
        this.locked = false;
        this.newState(text, text ? text.length - 1 : null, text ? text.length - 1 : null);

        this.element.addEventListener('selectionchange', this.selectionchange.bind(this));
        this.element.addEventListener('input', this.input.bind(this));

        if (text) {
            this.element.value = text;
        }
    }

    newState(text, selectionStart, selectionEnd, added, deleted) {
        if (this.locked) return;

        if (this.history.length > 0) {
            if (this.history[this.historyIndex].text == text) return;
        }

        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }

        this.history.push(new InputState(text, selectionStart, selectionEnd, added, deleted));
        this.historyIndex = this.history.length - 1;
    }

    selectionchange() {
        if (this.history.length == 0) return;

        this.history[this.historyIndex].selectionStart = this.element.selectionStart;
        this.history[this.historyIndex].selectionEnd = this.element.selectionEnd;
    }

    useLetter(letter) {
        if (!ABC.includes(letter)) return false;
        let count = inventory[letter];
        if (count > 0) {
            inventory_remove(letter);
            return letter;
        } else {
            return false;
        }
    }

    unuseLetter(letter) {
        if (!ABC.includes(letter)) return;
        inventory_add(letter);
    }

    input() {
        const prevState = this.history[this.historyIndex];
        const element = this.element;

        if (this.locked) {
            element.value = prevState.text;
            return;
        }

        let prevtext = prevState.text;
        let text = element.value;

        let added, deleted;
        let addedIndex = prevState.selectionStart;
        let deletedIndex = prevState.selectionEnd;
        let selWidth = prevState.selectionEnd - prevState.selectionStart;
        let caretPosition = element.selectionStart;
        let letterRejected = null;

        if (selWidth > 0) {
            deleted = prevtext.substring(addedIndex, deletedIndex);
        } else {
            deleted = prevtext;
            for (let char of text) {
                deleted = deleted.replace(char, "");
            }
        }

        added = text;
        let tempPrev = prevtext;
        if (selWidth > 0) {
            tempPrev = prevtext.substring(0, addedIndex) + prevtext.substring(deletedIndex);
        }
        for (let char of tempPrev) {
            added = added.replace(char, "");
        }

        let output = prevtext;
        let charsDeleted = "";
        if (deleted) {
            for (let char of deleted) {
                const letter = char.toLowerCase();
                if (ABC.includes(letter)) {
                    this.unuseLetter(letter);
                    charsDeleted += letter;
                }
            }
            if (selWidth == 0) {
                output = output.substring(0, caretPosition) + output.substring(deletedIndex);
            } else {
                output = output.substring(0, addedIndex) + output.substring(deletedIndex);
            }
        }

        let addable = "";
        let charsAdded = "";
        if (added) {
            for (let char of added) {
                const letter = char.toLowerCase();
                // if (ABC.includes(letter)) {
                    const result = this.useLetter(letter);
                    if (result) {
                        addable += char;
                        charsAdded += result;
                    } else {
                        letterRejected = letter;
                    }
                // } else {
                //     addable += char;
                // }
            }

            output = output.substring(0, addedIndex) + addable + output.substring(addedIndex);

            if (letterRejected) {
                element.classList.remove("rejected");
                element.classList.add("rejected");
                element.dataset.caretIndex = addedIndex;
                setTimeout(this.updateCaret.bind(this), 0);
                document.body.classList.add("letter-rejected");
                setTimeout(() => {
                    document.body.classList.remove("letter-rejected");
                }, 100);
            }
        }

        output = output.replace(/[^\x00-\x7F]/g, "");

        element.value = output;

        if (output != prevtext) {
            this.newState(output, element.selectionStart, element.selectionEnd, charsAdded, charsDeleted);
            if (this.oninput) this.oninput();

            // sfx("type");
        }
        if (letterRejected) {
            sfx("error");
        }
    }

    updateCaret() {
        const currentState = this.history[this.historyIndex];
        this.element.selectionStart = this.element.selectionEnd =
        currentState.selectionStart = currentState.selectionEnd =
        Number(this.element.dataset.caretIndex);
    }

    clear() {
        if (this.locked) return;

        const state = this.history[this.historyIndex];

        let deleting = "";
        for (let char of state.text) {
            const letter = char.toLowerCase();
            if (ABC.includes(letter)) {
                this.unuseLetter(letter);
                deleting += letter;
            }
        }

        this.newState("", 0, 0, "", deleting);
        if (this.oninput) this.oninput();
    }

    hasUndo() {
        return this.historyIndex > 0;
    }

    hasRedo() {
        return this.historyIndex < this.history.length - 1;
    }

    undo() {
        if (this.locked) return;
        if (this.historyIndex <= 0) return;

        const state = this.history[this.historyIndex];
        const deleted = state.deletedText;
        const added = state.addedText;
        inventory_remove(deleted);
        inventory_add(added);

        this.historyIndex--;
        if (this.oninput) this.oninput();
    }

    redo() {
        if (this.locked) return;
        if (this.historyIndex == this.history.length - 1) return;

        this.historyIndex++;
        if (this.oninput) this.oninput();

        const state = this.history[this.historyIndex];
        const deleted = state.deletedText;
        const added = state.addedText;
        inventory_remove(deleted);
        inventory_add(added);
    }

    burn() {
        this.element.value = "";
        this.history = [];
        this.newState();
        if (this.oninput) this.oninput();
    }

    delete() {
        this.clear();
    }
}