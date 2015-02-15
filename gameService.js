define(['jquery'], function($) {

    function GameService(gameAddress) {

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
    }

    return GameService;
});