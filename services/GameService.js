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

        function onQuerySuccess(id, data) {
            promises[id].resolve(data);
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

        this.requestGameState = function() {
            var data = {
                type: "get_state"
            };

            return sendCommand(data);
        };

        this.onConnect = function() {};
        this.onError = function() {};
        this.onDisconnect = function() {};
        this.onConnectedToGame = function() {};
        this.onStartRound = function(roundNumber, hand) {};
        this.onFinishPassing = function(receivedCards) {};
        this.onPlayCard = function(playerIndex, card) {};
        this.onPlayerConnected = function(playerIndex, playerId) {};
        this.onPlayerDisconnected = function(playerIndex) {};

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
                case "query_success":
                    onQuerySuccess(msg["command_id"], msg["data"]);
                    break;
                case "connected_to_game":
                    self.onConnectedToGame();
                    break;
                case "start_round":
                    self.onStartRound(msg["round_number"], msg["hand"]);
                    break;
                case "finish_passing":
                    self.onFinishPassing(msg["received_cards"]);
                    break;
                case "play_card":
                    self.onPlayCard(msg["player"], msg["card"]);
                    break;
                case "player_connected":
                    self.onPlayerConnected(msg["index"], msg["player"]);
                    break;
                case "player_disconnected":
                    self.onPlayerDisconnected(msg["index"]);
                    break;
            }
        };
    }

    return GameService;
});