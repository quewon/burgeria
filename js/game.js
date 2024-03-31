var player = {
    inventory: {},
    prices: {},
    tomorrowsPrices: {}
}

for (let char of abc) {
    player.inventory[char] = 1;
    player.prices = [0.5];
    player.tomorrowsPrices = 0.5;
}

function buyText(text) {
    console.log("+*: "+text);

    for (let char of text) {
        if (char in player.prices) {
            player.tomorrowsPrices[char] = Math.min(1, player.tomorrowsPrices[char] + .01);
        }
    }
}
  
function sellText(text) {
    console.log("-*: "+text);

    for (let char of text) {
        if (char in player.prices) {
            player.tomorrowsPrices[char] = Math.max(.01, player.tomorrowsPrices[char] - .01);
        }
    }
}

function calculateCost(text) {
    var cost = 0;

    for (let char of text) {
        const letter = char.toLowerCase();
        if (letter in playerdata.prices) {
            const prices = player.prices[letter];
            cost += prices[prices.length - 1];
        }
    }

    return cost;
}