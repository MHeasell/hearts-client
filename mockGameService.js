define(['jquery'], function($) {

    function MockGameService() {

        this.getHand = function(roundNumber, name, ticket) {
            var defer = $.Deferred();

            defer.resolve({ "cards": [
                "c4",
                "d5",
                "d3",
                "sq",
                "s4",
                "hk",
                "dj",
                "s7",
                "c5",
                "h2",
                "sj",
                "c1",
                "d8"
            ] });

            return defer.promise();
        };

        this.getPlayers = function() {
            var defer = $.Deferred();

            defer.resolve({ "players": ["Joe", "Bob", "Steve", "Alan"] });

            return defer.promise();
        };

        this.passCards = function(roundNumber, targetName, cards, ticket) {

            var defer = $.Deferred();

            defer.resolve({ "success": true });

            return defer.promise();
        };

        this.getPassedCards = function(roundNumber, name, ticket) {
            var defer = $.Deferred();

            defer.resolve({
                "passed": true,
                "card1": "h1",
                "card2": "cj",
                "card3": "d1"
            });

            return defer.promise();
        };

        this.addCardToPile = function(roundNumber, pileNumber, name, card, ticket) {
            var defer = $.Deferred();

            defer.resolve({ "success": true });

            return defer.promise();
        };

        this.getPileCard = function(roundNumber, pileNumber, cardNumber) {
            var defer = $.Deferred();

            if (cardNumber === 1) {
                defer.resolve({ "player": "Bob", "card": "c2" });
            }
            else if (cardNumber === 2) {
                defer.resolve({ "player": "Steve", "card": "c5" });
            }
            else if (cardNumber === 3) {
                defer.resolve({ "player": "Alan", "card": "dk" });
            }
            else if (cardNumber === 4) {
                defer.resolve({ "player": "Joe", "card": "c7" });
            }

            return defer.promise();
        };

        this.waitForPileCard = function(roundNumber, pileNumber, cardNumber) {
            return this.getPileCard(roundNumber, pileNumber, cardNumber);
        };

        this.waitForPassedCards = function(roundNumber, name, ticket) {
            var defer = $.Deferred();

            defer.resolve({
                "passed": true,
                "card1": "h1",
                "card2": "cj",
                "card3": "d1"
            });

            return defer.promise();
        };
    }

    return MockGameService;
});