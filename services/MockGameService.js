define(['jquery'], function($) {

    function MockGameService() {

        var self = this;

        var events = [
            { type: "round_start", "round_number": 1 }
        ];

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

        this.waitForHand = function(roundNumber, name, ticket) {
            return this.getHand(roundNumber, name, ticket);
        };

        this.getPlayers = function() {
            var defer = $.Deferred();

            defer.resolve({ "players": ["Joe", "Bob", "Steve", "Alan"] });

            return defer.promise();
        };

        this.passCards = function(roundNumber, targetName, cards, ticket) {

            var defer = $.Deferred();

            defer.resolve({ "success": true });

            events.push({ type: "passing_completed", "round_number": roundNumber });
            events.push({ type: "play_card", "round_number": roundNumber, "pile_number": 1, "card_number": 1, player: "Bob", card: "c2" });
            events.push({ type: "play_card", "round_number": roundNumber, "pile_number": 1, "card_number": 2, player: "Steve", card: "c5" });
            events.push({ type: "play_card", "round_number": roundNumber, "pile_number": 1, "card_number": 3, player: "Alan", card: "dk" });

            return defer.promise();
        };

        this.getPassedCards = function(roundNumber, name, ticket) {
            var defer = $.Deferred();

            defer.resolve({
                "cards": ["h1", "cj", "d1"]
            });

            return defer.promise();
        };

        this.addCardToPile = function(roundNumber, pileNumber, name, card, ticket) {
            var defer = $.Deferred();

            defer.resolve({ "success": true });

            events.push({ type: "play_card", "round_number": roundNumber, "pile_number": pileNumber, "card_number": 4, player: name, card: card });

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

        this.getEvent = function(eventNumber) {
            var defer = $.Deferred();

            var zeroEventNumber = eventNumber - 1;
            if (zeroEventNumber >= events.length) {
                defer.reject({ status: 404 });
            }
            else {
                defer.resolve(events[zeroEventNumber]);
            }

            return defer.promise();
        };

        this.waitForEvent = function(eventNumber) {
            var defer = $.Deferred();

            (function pollEvent() {
                self.getEvent(eventNumber)
                    .done(function(data) {
                        defer.resolve(data);
                    })
                    .fail(function(xhr) {
                        if (xhr.status === 404) {
                            setTimeout(pollEvent, 500);
                        }
                        else {
                            defer.reject();
                        }
                    });
            })();

            return defer.promise();
        };
    }

    return MockGameService;
});