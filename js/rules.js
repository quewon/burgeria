export default class rules {
    static recipes = {
        "burger": (list) => {
            if (!rules.list_match_count(list, "bun"))
                return { message: "needs bread" }
            if (
                !rules.match_ingredient(list[0], "bun") ||
                !rules.match_ingredient(list[list.length - 1], "bun")
            )
                return { message: "not a burger" }
            const ingredient_count = rules.list_match_count(list, "ingredient");
            if (ingredient_count < 3)
                return { message: "more ingredients please" }
            return { success: true, score: 1 }
        },
        "onion burger": (list) => {
            const burger_check = rules.recipes.burger(list);
            if (!burger_check.success) return burger_check;

            const onion_count = rules.list_match_count(list, "onion");
            if (onion_count > 4) {
                return { message: "too many onions" }
            } else if (onion_count > 0) {
                var onion_score = 0;
                var onion_message = null;
                switch (onion_count) {
                    case 1:
                        onion_message = "more onions next time";
                        onion_score = 1;
                        break;
                    case 2:
                        onion_message = "more onions next time";
                        onion_score = 2;
                        break;
                    case 3:
                        onion_message = "perfect";
                        onion_score = 3;
                        break;
                    case 4:
                        onion_message = "thats a lot of onions";
                        onion_score = 2;
                        break;
                }
                const extra_ingredients_score = rules.list_match_count(list, "ingredient") - onion_count - 2;
                return { success: true, message: onion_message, score: onion_score + extra_ingredients_score }
            }
        },
        "tomato burger": (list) => {
            const burger_check = rules.recipes.burger(list);
            if (!burger_check.success) return burger_check;

            const tomato_count = rules.list_match_count(list, "tomato");
            if (!rules.list_match_count(list, "tomato"))
                return { message: "wheres the tomato" }
            const extra_ingredients_score = rules.list_match_count(list, "ingredient") - tomato_count - 2;
            return { success: true, score: 1 + extra_ingredients_score }
        },
        "burgeria special": (list) => {
            const burger_check = rules.recipes.burger(list);
            if (!burger_check.success) return burger_check;

            if (!rules.list_match_count(list, "patty"))
                return { message: "i need my protein" }
            var score = 5;
            if (!rules.list_match_count(list, "sauce"))
                score -= 1;
            if (!rules.list_match_count(list, "cheese"))
                score -= 1;
            const greens_count = rules.list_match_count(list, "greens");
            if (greens_count == 0) {
                score -= 2;
            } else if (greens_count == 1) {
                score -= 1;
            }
            const extra_ingredients_score = rules.list_match_count(list, "ingredient") - list.length;
            return { success: true, score: score + extra_ingredients_score }
        }
    }

    static synonyms = {
        "ingredient": ["bun", "patty", "cheese", "greens", "mushroom"],
        "bun": ["bread", "baguette", "loaf", "bagel", "flatbread", "toast", "focaccia", "sourdough", "roti", "chapati", "naan", "ciabatta", "cornbread", "roll"],
        "patty": ["meat", "tofu", "mushroom"],
        "meat": ["cutlet", "rib", "ham", "sausage", "seafood", "beef", "poultry", "lamb", "goat", "venison", "bison", "horse", "rabbit"],
        "poultry": ["chicken", "turkey", "duck", "goose", "geese", "pheasant", "quail"],
        "seafood": ["fish", "shrimp", "octopus"],
        "sausage": ["pepperoni", "bratwurst", "frankfurter", "chorizo", "salami"],
        "fish": ["tuna", "salmon", "cod", "mackerel"],
        "beef": ["veal", "steak"],
        "pork": ["porkchop", "bacon"],
        "lamb": ["mutton", "lambchop"],
        "cheese": ["cheddar", "emmental", "brie", "mozzarella", "raclette", "provolone", "scamorza", "burrata", "gouda", "fontina", "camembert", "reblochon", "morbier", "parmesan", "feta", "ricotta"],
        "greens": ["veggies", "veggie", "vegetables", "vegetable", "lettuce", "cucumber", "asparagus", "arugula", "kale", "celery", "eggplant", "zucchini", "artichoke", "onion", "squash", "corn", "pepper", "avocado", "pickle", "tomato"],
        "tomato": ["tomatoes"],
        "pickle": ["pickles"],
        "eggplant": ["eggplants"],
        "onion": ["onions"],
        "pepper": ["peppers"],
        "arugula": ["rocket"],
        "mushroom": ["mushrooms"]
    }
    
    static list_match_count(list, ingredient) {
        var count = 0;
        for (let item of list) {
            if (this.match_ingredient(item, ingredient)) count++;
        }
        return count;
    }

    static match_ingredient(text, ingredient) {
        if (text == ingredient) return true;
        if (ingredient in rules.synonyms) {
            for (let synonym of rules.synonyms[ingredient]) {
                if (this.match_ingredient(text, synonym)) return true;
            }
        }
        return false;
    }
}