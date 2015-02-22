define(['jquery'], function($) {

    var POLL_INTERVAL = 5000;

    function GameService(gameAddress) {
        var self = this;

        this.getHand = function(roundNumber, name, ticket) {
            var data = { "ticket": ticket };

            var encodedName = encodeURIComponent(name);

            return $.get(
                gameAddress + "/rounds/" + roundNumber + "/players/" + encodedName + "/hand",
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

            var encodedRoundNumber = encodeURIComponent(roundNumber);
            var encodedTargetName = encodeURIComponent(targetName);
            var encodedTicket = encodeURIComponent(ticket);

            return $.post(
                gameAddress + "/rounds/" + encodedRoundNumber + "/players/" + encodedTargetName + "/passed_cards?ticket=" + encodedTicket,
                data);
        };

        this.getPassedCards = function(roundNumber, name, ticket) {
            var encodedRoundNumber = encodeURIComponent(roundNumber);
            var encodedName = encodeURIComponent(name);
            var encodedTicket = encodeURIComponent(ticket);

            return $.get(gameAddress + "/rounds/" + encodedRoundNumber + "/players/" + encodedName + "/passed_cards?ticket=" + encodedTicket);
        };

        this.addCardToPile = function(roundNumber, pileNumber, name, card, ticket) {
            var encodedRoundNumber = encodeURIComponent(roundNumber);
            var encodedPileNumber = encodeURIComponent(pileNumber);
            var encodedTicket = encodeURIComponent(ticket);

            var data = { "player": name, "card": card };
            return $.post(
                gameAddress + "/rounds/" + encodedRoundNumber + "/piles/" + encodedPileNumber + "?ticket=" + encodedTicket,
                data);
        };

        this.getPileCard = function(roundNumber, pileNumber, cardNumber) {
            var encodedRoundNumber = encodeURIComponent(roundNumber);
            var encodedPileNumber = encodeURIComponent(pileNumber);
            var encodedCardNumber = encodeURIComponent(cardNumber);

            return $.get(gameAddress + "/rounds/" + encodedRoundNumber + "/piles/" + encodedPileNumber + "/" + encodedCardNumber);
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