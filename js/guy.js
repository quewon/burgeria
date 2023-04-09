class guy {
  constructor() {
    this.id = playerdata.guys.length;

    const portraits = ["cat", "fish", "monkeey", "mouse"];
    const voicebank = [
      []
    ];

    let portrait = portraits[portraits.length * Math.random() | 0];
    let imageSource = "img/"+portrait+".png";

    let div = divContainingTemplate("template-guy");
    let img = div.querySelector("img");
    img.src = imageSource;
    img.alt = img.title = portrait;

    let text = div.querySelector("[name='text']");

    this.imageElement = img;
    this.textElement = text;
    this.element = div;

    scenes.storefront.day.guysContainer.appendChild(this.element);

    new tray();
    playerdata.guys.push(this);
    sfx("chime");
  }

  update() {

  }
}
