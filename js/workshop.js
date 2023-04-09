function init_workshop() {
  const workshop = scenes.kitchen.workshop;

  function use_letter(letter) {
    let count = gamedata.letters[letter];
    if (count > 0) {
      gamedata.letters[letter]--;
      updateList(scenes.kitchen.lettersList, gamedata.letters);
      return letter;
    } else {
      return false;
    }
  }
  function unuse_letter(letter) {
    if (!(letter in gamedata.letters)) {
      gamedata.letters[letter] = 0;
    }
    gamedata.letters[letter]++;
    updateList(scenes.kitchen.lettersList, gamedata.letters);
  }

  function update_workshop(e) {
    let abcs = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

    let prevtext = gamedata.workshop;
    let text = this.value;

    let added = "";
    let deleted = "";
    let caret = 0;



    console.log(prevtext, text);
    console.log("added: "+added, "deleted: "+deleted, caret);

    gamedata.workshop = this.value;
    sfx("type");
  }

  workshop.addEventListener("input", update_workshop);
}
