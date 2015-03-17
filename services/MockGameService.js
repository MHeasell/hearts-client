define(['jquery'], function($) {

    function MockGameService() {

        var self = this;

        this.onConnect = function() {};
        this.onError = function() {};
        this.onDisconnect = function() {};
        this.onConnectedToGame = function() {};
        this.onStartRound = function(roundNumber, hand) {};
        this.onFinishPassing = function(receivedCards) {};
        this.onPlayCard = function(playerIndex, card) {};
        this.onPlayerConnected = function(playerIndex, playerId) {};
        this.onPlayerDisconnected = function(playerIndex) {};

        this.requestGameState = function() {
            var defer = $.Deferred();
            defer.resolve({
                "state_data": {
                    "pass_direction": "left",
                    "round_number": 0,
                    "have_passed": false,
                    "hand": ["d1", "c7", "c4", "s6", "d8", "h2", "s7", "c1", "dk", "hq", "d10", "sj", "c9"]
                },
                "game_id": 1,
                "state": "passing",
                "scores": [0, 0, 0, 0],
                "players": [1, 2, 3, 4]
            });

            return defer.promise();
        };

        this.passCards = function(roundNumber, targetName, cards, ticket) {
            var defer = $.Deferred();
            defer.resolve();

            setTimeout(function() {
                self.onFinishPassing(["c2", "c10", "c8"]);
            }, 1000);

            return defer.promise();
        };
    }

    return MockGameService;
});