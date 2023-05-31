var REQUESTS = [
  {
    // letter for loved one
    level: 1,
    frequency: 1,
    init: function(guy) {
      const to = randomFromArray([
        "to", "for", "dear"
      ]);

      const person = randomFromArray([
        "mom", "dad", "my brother", "my sister", "my child", "my mentor"
      ]);

      const message = randomFromArray([
        "miss you", "how are you", "worried about you", "care about you", "want to see you", "i'm ok", "i'm here", "coming back", "take a while", "scared", "hopeful", "happy", "the money", "a long time", "away", "i won't", "i can't", "i must", "you can't", "you must", "should not"
      ]);

      const signoff = randomFromArray([
        "love,", "from,", "sincerely,"
      ]);

      guy.request.title = "A LETTER FOR "+person;
      guy.request.addRule({ type: "startString", condition: to+" "+person });
      guy.request.addRule({ type: "contain", condition: message });
      guy.request.addRule({ type: "endString", condition: signoff+" "+guy.name });
      guy.request.addRule({ type: "minLetterCount", condition: ("to "+person+" miss you love "+guy.name).length + 5 });
      guy.request.setCompensation({
        type: "points",
        condition: Math.ceil(calculateCost("to "+person+" "+message+" love "+guy.name) * 1.5)
      });
    }
  },

  {
    // a paper
    level: 1,
    frequency: 1,
    init: function(guy) {
      var a = randomFromArray([
        "a", "the"
      ]);

      const study = randomFromArray([
        "study of", "study on", "study about",
        "paper of", "paper on", "paper about",
        "theory of", "theory on", "theory about",
        "practice of",
        "exercise of", "exercise with",
        "application of",
        "procedure of", "procedure in"
      ]);

      if (a == "a" && "aeiou".indexOf(study[0]) != -1) {
        a = "an";
      }

      const subject = randomFromArray([
        "words", "letters", "pieces", "writing", "ink", "burgers", "the burger", "Burgeria", "meat", "buns", "sauce", "onion", "sleep", "mazes", "the House", "the sea", "the ocean", "sailing", "drifters", "wandering", "navigation", "dreams", "games", "something", "somewhere", "everything", "everywhere", "time", "yesterday", "tomorrow", "today", "you", "me", "forever", "immortality", "love"
      ]);

      const title = a+" "+study+" "+subject;

      const message = randomFromArray([
        "dangerous", "suspicious", "caution", "interesting", "intrigue", "curious", "hope", "future", "imperative", "precedent", "paradigm", "status quo", "agent", "tasty", "yum"
      ]);

      guy.request.title = "A PAPER CONTAINING MY FINDINGS";
      guy.request.addRule({ type: "startString", condition: title });
      guy.request.addRule({ type: "contain", condition: message });
      guy.request.addRule({ type: "minLetterCount", condition: (title+message).length + 10 });
      // guy.request.setCompensation({
      //   type: "points",
      //   condition: Math.ceil(calculateCost(title+message) * 3)
      // });

      const gift = randomFromArray([
        "scratched up disk",
        "photograph of a home",
        "portrait of you at the storefront",
        "ugly knit sweater",
        "mittens",
      ]);

      guy.request.setCompensation({
        type: "gift",
        condition: gift
      });
    }
  },

  {
    // a creative piece
    level: 1,
    frequency: 1,
    init: function(guy) {
      const song = randomFromArray([
        "song", "story", "poem"
      ]);

      const subject = randomFromArray([
        "love", "goodbyes", "burger", "heroes", "good", "me", "you", "home"
      ]);

      const title = "A "+song+" ABOUT "+subject;

      // const contain = randomFromArray([
      //   "", "", "",
      //   ""
      // ]);

      guy.request.title = title;
      // if (contain != "") guy.request.addRule({ type: "contain", condition: contain });
      guy.request.addRule({ type: "minLetterCount", condition: 20 });
      // guy.request.setCompensation({
      //   type: "points",
      //   condition: Math.ceil(calculateCost(subject) * 5)
      // });

      guy.request.setCompensation({
        type: "piece",
        condition: null
      });
    }
  },
];

function randomFromArray(arr) {
  return arr[arr.length * Math.random() | 0];
}
