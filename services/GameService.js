define(['jquery'], function($) {

    function GameService(serverAddress) {
        var self = this;

        var socket = new WebSocket(serverAddress);

        var promises = {};

        var nextCommandId = 0;

        function onCommandSuccess(id) {
            promises[id].resolve();
            delete promises[id];
        }

        function onCommandFail(id) {
            promises[id].reject();
            delete promises[id];
        }

        function getNextCommandId() {
            return nextCommandId++;
        }

        function sendCommand(data) {
            var defer = $.Deferred();

            var id = getNextCommandId();
            var mergedData = $.extend({}, data, { "command_id": id });
            var strData = JSON.stringify(mergedData);
            socket.send(strData);
            console.log("Sent: " + strData);

            promises[id] = defer;

            return defer;
        }

        this.disconnect = function() {
            socket.close();
        };

        this.sendAuth = function(ticket) {
            var data = { "type": "auth", "ticket": ticket };
            return sendCommand(data);
        };

        this.passCards = function(cards) {
            var data = {
                "type": "pass_card",
                "cards": [cards[0], cards[1], cards[2]]
            };

            return sendCommand(data);
        };

        this.playCard = function(card) {
            var data = {
                "type": "play_card",
                "card": card
            };

            return sendCommand(data);
        };

        this.onConnect = function() {};
        this.onError = function() {};
        this.onDisconnect = function() {};
        this.onReceiveGameState = function(data) {};
        this.onStartPreround = function(hand, passDirection) {};
        this.onFinishPreround = function(receivedCards) {};
        this.onStartPlaying = function(hand) {};
        this.onPlayCard = function(playerIndex, card) {};
        this.onFinishTrick = function(winner, points) {};

        socket.onopen = function() {
            self.onConnect();
        };

        socket.onerror = function() {
            self.onError();
        };

        socket.onclose = function() {
            self.onDisconnect();
        };

        socket.onmessage = function(event) {
            var msg = JSON.parse(event.data);
            console.log("Received: " + event.data);
            switch (msg["type"]) {
                case "command_success":
                    onCommandSuccess(msg["command_id"]);
                    break;
                case "command_fail":
                    onCommandFail(msg["command_id"]);
                    break;
                case "game_data":
                    self.onReceiveGameState(msg);
                    break;
                case "start_preround":
                    self.onStartPreround(msg["hand"], msg["pass_direction"]);
                    break;
                case "finish_preround":
                    self.onFinishPreround(msg["received_cards"]);
                    break;
                case "start_playing":
                    self.onStartPlaying(msg["hand"]);
                    break;
                case "play_card":
                    self.onPlayCard(msg["player"], msg["card"]);
                    break;
                case "finish_trick":
                    self.onFinishTrick(msg["winner"], msg["points"]);
                    break;
            }
        };
    }

    return GameService;
});