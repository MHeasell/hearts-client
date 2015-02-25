define([], function() {

    function getSingularSuitName(suit) {
        switch (suit) {
            case "c":
                return "club";
            case "s":
                return "spade";
            case "d":
                return "diamond";
            case "h":
                return "heart";
            default:
                throw new Error("Invalid suit: " + suit);
        }
    }

    function containsSuit(cards, suit) {
        for (var i = 0; i < cards.length; i++) {
            var c = cards[i];
            if (parseCard(c).suit === suit) {
                return true;
            }
        }

        return false;
    }

    function sumPoints(cards) {
        var points = 0;
        for (var i = 0; i < cards.length; i++) {
            var c = cards[i];
            if (parseCard(c).suit === "h") {
                points += 1;
            }
            else if (c === "sq") {
                points += 13;
            }
        }

        return points;
    }

    /**
     * Finds the winner of this pile of cards.
     *
     * @param cards {Array} An array of string "card" values.
     * There must be at least one card in the array.
     * @returns {Number} The index of the winning card.
     */
    function findWinningIndex(cards) {
        var parsedCards = cards.map(parseCard);

        var suit = parsedCards[0].suit;

        var winner = { index: -1, numericRank: 0 };
        for (var i = 0; i < parsedCards.length; i++) {
            var c = parsedCards[i];

            if (c.suit !== suit) {
                continue;
            }

            var numRank = convertToNumericRank(c.rank);
            if (numRank > winner.numericRank) {
                winner = { index: i, numericRank: numRank };
            }
        }

        return winner.index;
    }

    /**
     * Converts the given string rank into a sortable numeric value.
     * @param rank {String} The rank string
     * @returns {Number} The numeric representation of the rank.
     */
    function convertToNumericRank(rank) {
        switch (rank) {
            case "j":
                return 11;
            case "q":
                return 12;
            case "k":
                return 13;
            case "1":
                return 14;
            default:
                return parseInt(rank);
        }
    }

    function parseCard(val) {
        var suit = val.charAt(0);
        var rank = val.slice(1);

        return { suit: suit, rank: rank };
    }

    function getPassDirection(roundNumber) {
        var dirs = ["left", "right", "across", "none"];
        var idx = (roundNumber - 1) % 4;
        return dirs[idx];
    }

    function getPassOffset(direction) {
        switch (direction) {
            case "left":
                return 1;
            case "right":
                return 3;
            case "across":
                return 2;
            case "none":
                return 0;
            default:
                throw new Error("Invalid pass direction: " + direction);
        }
    }

    return {
        findWinningIndex: findWinningIndex,
        sumPoints: sumPoints,
        parseCard: parseCard,
        getSingularSuitName: getSingularSuitName,
        containsSuit: containsSuit,
        getPassDirection: getPassDirection,
        getPassOffset: getPassOffset
    };
});



