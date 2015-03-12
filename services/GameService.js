define(['jquery'], function($) {

    function GameService(serverAddress) {
        var self = this;

        var socket = new WebSocket(serverAddress);

        var authPromise = null;
        var commandPromise = null;

        function onAuthSuccess() {
            authPromise.resolve();
            authPromise = null;
        }

        function onAuthFail() {
            authPromise.reject();
            authPromise = null;
        }

        function onCommandSuccess() {
            commandPromise.resolve();
            commandPromise = null;
        }

        function onCommandFail() {
            commandPromise.reject();
            commandPromise = null;
        }

        function sendCommand(data) {
            var strData = JSON.stringify(data);
            socket.send(strData);
            console.log("Sent: " + strData);
        }

        this.disconnect = function() {
            socket.close();
        };

        this.sendAuth = function(ticket) {
            authPromise = $.Deferred();
            var data = { "type": "auth", "ticket": ticket };
            sendCommand(data);
            return authPromise;
        };

        this.passCards = function(cards) {
            commandPromise = $.Deferred();

            var data = {
                "type": "pass_card",
                "cards": [cards[0], cards[1], cards[2]]
            };

            sendCommand(data);

            return commandPromise;
        };

        this.playCard = function(card) {
            commandPromise = $.Deferred();

            var data = {
                "type": "play_card",
                "card": card
            };

            sendCommand(data);

            return commandPromise;
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
                case "auth_success":
                    onAuthSuccess();
                    break;
                case "auth_fail":
                    onAuthFail();
                    break;
                case "command_success":
                    onCommandSuccess();
                    break;
                case "command_fail":
                    onCommandFail();
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