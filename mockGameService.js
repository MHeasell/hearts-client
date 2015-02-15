define(['jquery'], function($) {

    function MockGameService() {

        this.getHand = function(name, ticket) {
            var defer = $.Deferred();

            defer.resolve({ "cards": ["c2", "d5", "d3", "sq"] });

            return defer.promise();
        };

        this.getPlayers = function() {
            var defer = $.Deferred();

            defer.resolve({ "players": ["Joe", "Bob", "Mitch", "Alan"] });

            return defer.promise();
        };

        this.passCards = function(targetName, cards, ticket) {

            var defer = $.Deferred();

            defer.resolve({ "success": true });

            return defer.promise();
        };
    }

    return MockGameService;
});