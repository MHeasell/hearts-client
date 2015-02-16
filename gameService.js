define(['jquery'], function($) {

    var POLL_INTERVAL = 5000;

    function GameService(gameAddress) {
        var self = this;

        this.getHand = function(name, ticket) {
            var data = { "ticket": ticket };
            var promise = $.get(
                gameAddress + "/players/" + name + "/hand",
                data);
            return promise;
        };

        this.getPlayers = function() {
            var promise = $.get(gameAddress + "/players");
            return promise;
        };

        this.passCards = function(targetName, cards, ticket) {
            var data = {
                card1: cards[0],
                card2: cards[1],
                card3: cards[2]
            };

            var promise = $.post(
                gameAddress + "/players/" + targetName + "/passed_cards?ticket=" + ticket,
                data);
            return promise;
        };

        this.getPassedCards = function(name, ticket) {
            return $.get(gameAddress + "/players"/ + name + "/passed_cards?ticket=" + ticket);
        };

        this.addCardToPile = function(pileNumber, name, card, ticket) {
            var data = { "player": name, "card": card };
            var promise = $.post(
                gameAddress + "/piles/" + pileNumber + "?ticket=" + ticket,
                data);
            return promise;
        };

        this.getPileCard = function(pileNumber, cardNumber) {
            return $.get(gameAddress + "/piles/" + pileNumber + "/" + cardNumber);
        };

        this.waitForPileCard = function(pileNumber, cardNumber) {
            var defer = $.Deferred();

            (function pollPile() {
                self.getPileCard(pileNumber, cardNumber)
                    .done(function(data) {
                        defer.resolve(data);
                    })
                    .fail(function(xhr) {
                        if (xhr.status === 404) {
                            setTimeout(pollPile, POLL_INTERVAL);
                        }
                        else {
                            defer.reject();
                        }
                    });
            })();

            return defer.promise();
        };

        this.waitForPassedCards = function(name, ticket) {
            var defer = $.Deferred();

            (function pollPassedCards() {
                self.getPassedCards(name, ticket)
                    .done(function(data) {
                        if (data["passed"]) {
                            defer.resolve(data);
                        }
                        else {
                            setTimeout(pollPassedCards, POLL_INTERVAL);
                        }
                    })
                    .fail(function() {
                        defer.reject();
                    });
            })();

            return defer.promise();
        };
    }

    return GameService;
});