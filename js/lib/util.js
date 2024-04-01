const abc = "abcdefghijklmnopqrstuvwxyz";

function aabb(x1, y1, w1, h1, x2, y2, w2, h2) {
  return x1 <= x2 + w2 && x1 + w1 >= x2 && y1 <= y2 + h2 && y1 + h1 >= y2;
}

function letterCount(text) {
  let letters = 0;
  for (let char of text) {
    const letter = char.toLowerCase();
    if (abc.includes(letter)) {
      letters++;
    }
  }
  return letters;
}

function elementInClass(el, className) {
  if (el) {
    let parent = el;
    while (parent != document.documentElement) {
        if (parent.classList.contains(className)) {
            return true;
        } else {
            parent = parent.parentElement;
        }
    }
  }

  return false;
}

function createElementFromTemplate(id) {
  var template = document.getElementById(id);
  return template.content.firstElementChild.cloneNode(true);
}

//https://stackoverflow.com/a/3866442
function focusOnContenteditable(contentEditableElement) {
  var range, selection;
  if (document.createRange)//Firefox, Chrome, Opera, Safari, IE 9+
  {
      range = document.createRange();//Create a range (a range is a like the selection but invisible)
      range.selectNodeContents(contentEditableElement);//Select the entire contents of the element with the range
      range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
      selection = window.getSelection();//get the selection object (allows you to change selection)
      selection.removeAllRanges();//remove any selections already made
      selection.addRange(range);//make the range you have just created the visible selection
  } else if (document.selection)//IE 8 and lower
  { 
      range = document.body.createTextRange();//Create a range (a range is a like the selection but invisible)
      range.moveToElementText(contentEditableElement);//Select the entire contents of the element with the range
      range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
      range.select();//Select the range (make it the visible selection
  }
}

function clamp(a, min, max) {
  return Math.max(Math.min(a, max), min);
}

function lerp(a, b, t) {
  return a * (1 - t) + b * t;
}

function smoothstep(x) {
  return x * x * (3 - 2 * x);
}

class Vector2 {
  constructor(x, y) {
    this.x = x || 0;
    this.y = y || 0;
  }

  sqrMagnitude() {
    return this.x * this.x + this.y * this.y;
  }

  magnitude() {
    return Math.sqrt(this.sqrMagnitude());
  }

  normalize() {
    if (this.x == 0 && this.y == 0) {
      return this;
    }

    let d = this.magnitude();

    return new Vector2(this.x / d, this.y / d);
  }

  mul(v) {
    return new Vector2(this.x * v, this.y * v);
  }

  div(v) {
    if (v == 0) return this;
    return new Vector2(this.x / v, this.y / v);
  }

  add(v2) {
    return new Vector2(this.x + v2.x, this.y + v2.y);
  }

  sub(v2) {
    return new Vector2(this.x - v2.x, this.y - v2.y);
  }

  distanceTo(v2) {
    let difference = v2.sub(this);
    return difference.magnitude();
  }

  jiggle(v) {
    v = v || 0.1;

    return new Vector2(this.x + Math.random() * v - v/2, this.y + Math.random() * v - v/2);
  }

  lerp(v2, t) {
    return new Vector2(
      lerp(this.x, v2.x, t),
      lerp(this.y, v2.y, t)
    )
  }

  abs() {
    return new Vector2(
      Math.abs(this.x),
      Math.abs(this.y)
    )
  }
}