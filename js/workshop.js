function init_workshop() {
  const workshop = ui.kitchen.workshop;

  function use_letter(letter) {
    let count = playerdata.letters[letter];
    if (count > 0) {
      playerdata.letters[letter]--;
      updateList(ui.kitchen.lettersList, playerdata.letters);
      return letter;
    } else {
      return false;
    }
  }
  function unuse_letter(letter) {
    if (!(letter in playerdata.letters)) {
      playerdata.letters[letter] = 0;
    }
    playerdata.letters[letter]++;
    updateList(ui.kitchen.lettersList, playerdata.letters);
  }

  function update_workshop(e) {
    let abcs = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

    let prevtext = playerdata.workshop;
    let text = this.value;

    let added = "";
    let deleted = "";
    let caret = 0;



    console.log(prevtext, text);
    console.log("added: "+added, "deleted: "+deleted, caret);

    playerdata.workshop = this.value;
    sfx("type");
  }

  workshop.addEventListener("input", update_workshop);
}
