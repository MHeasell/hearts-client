define(['jquery'], function($) {

    var POLL_INTERVAL = 5000;

    function GameService(gameAddress) {
        var self = this;

        this.getHand = function(roundNumber, name, ticket) {
            var data = { "ticket": ticket };
            return $.get(
                gameAddress + "/rounds/" + roundNumber + "/players/" + name + "/hand",
                data);
        };

        this.waitForHand = function(roundNumber, name, ticket) {
            var defer = $.Deferred();

            (function pollHand() {
                self.getHand(roundNumber, name, ticket)
                    .done(function(data) {
                        defer.resolve(data);
                    })
                    .fail(function(xhr) {
                        if (xhr.status === 404) {
                            setTimeout(pollHand, POLL_INTERVAL);
                        }
                        else {
                            defer.reject();
                        }
                    });
            })();

            return defer.promise();
        };

        this.getPlayers = function() {
            return $.get(gameAddress + "/players");
        };

        this.passCards = function(roundNumber, targetName, cards, ticket) {
            var data = {
                card1: cards[0],
                card2: cards[1],
                card3: cards[2]
            };

            return $.post(
                gameAddress + "/rounds/" + roundNumber + "/players/" + targetName + "/passed_cards?ticket=" + ticket,
                data);
        };

        this.getPassedCards = function(roundNumber, name, ticket) {
            return $.get(gameAddress + "/rounds/" + roundNumber + "/players/" + name + "/passed_cards?ticket=" + ticket);
        };

        this.addCardToPile = function(roundNumber, pileNumber, name, card, ticket) {
            var data = { "player": name, "card": card };
            return $.post(
                gameAddress + "/rounds/" + roundNumber + "/piles/" + pileNumber + "?ticket=" + ticket,
                data);
        };

        this.getPileCard = function(roundNumber, pileNumber, cardNumber) {
            return $.get(gameAddress + "/rounds/" + roundNumber + "/piles/" + pileNumber + "/" + cardNumber);
        };

        this.waitForPileCard = function(roundNumber, pileNumber, cardNumber) {
            var defer = $.Deferred();

            (function pollPile() {
                self.getPileCard(roundNumber, pileNumber, cardNumber)
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

        this.waitForPassedCards = function(roundNumber, name, ticket) {
            var defer = $.Deferred();

            (function pollPassedCards() {
                self.getPassedCards(roundNumber, name, ticket)
                    .done(function(data) {
                        defer.resolve(data);
                    })
                    .fail(function(xhr) {
                        if (xhr.status === 404) {
                            setTimeout(pollPassedCards, POLL_INTERVAL);
                        }
                        else {
                            defer.reject();
                        }
                    });
            })();

            return defer.promise();
        };
    }

    return GameService;
});