
var serverAddress = "http://192.168.254.134:5000";

var queueAddress = serverAddress + "/queue";

$(function() {
    "use strict";

    function MainModel() {
        this.componentInfo = ko.observable({name:'queueView', params: {}});
    }

    var mainModel = new MainModel();

    function setComponent(name, params) {
        mainModel.componentInfo({name: name, params: params});
    }

    function QueueViewModel() {
        this.name = ko.observable("Steve");

        this.state = ko.observable("ready");

        this.canEditPlayerName = ko.computed(function() {
            return this.state() === "ready";
        }, this);

        this.queueButtonEnabled = ko.computed(function() {
            return this.state() === "ready";
        }, this);

        this.showLoadingMessage = ko.computed(function() {
            return this.state() === "queuing";
        }, this);

        var authTicket = null;

        var self = this;

        this.queue = function () {
            var data = { "name": this.name() };
            var promise = $.post(serverAddress + "/queue", data);
            this.state("sendingRequest");

            promise.done(function(data) {
                self.state("queuing");
                self.authTicket = data["ticket"];
                pollQueue();
            });
            promise.fail(function() {
                self.state("ready");
            });
        };

        function pollQueue() {
            setTimeout(function() {
                var data = {"ticket": self.authTicket};
                var promise = $.get(queueAddress + "/" + self.name(), data);
                promise.done(function (data) {
                    if (data["matched"]) {
                        var gameLink = data["link"];
                        setComponent("gameView", { link: gameLink, ticket: self.authTicket, name: self.name() });
                    }
                    else {
                        pollQueue();
                    }
                });
            }, 5000);
        }
    }

    function GameViewModel(params) {
        var self = this;

        this.hand = ko.observableArray();
        this.pile = ko.observableArray([
            { card: "c6", position: "left" },
            { card: "d9", position: "across" },
            { card: "sk", position: "right" }
        ]);

        this.players = ko.observableArray();

        this.selectedCards = ko.observableArray();

        this.gameState = ko.observable("passing");

        this.name = params.name;

        this.playerNumber = null;

        this.passEnabled = ko.computed(function() {
            return this.selectedCards().length === 3;
        }, this);

        var authTicket = params.ticket;
        var gameLink = params.link;

        this.clickCard = function(val) {
            if (self.gameState() === "passing") {
                var idx = self.selectedCards.indexOf(val);
                if (idx >= 0) {
                    self.selectedCards.splice(idx, 1);
                }
                else {
                    self.selectedCards.push(val);
                }
            }
        };

        this.passCards = function() {
            var passPlayerNumber = (this.playerNumber + 1) % 4;
            var passPlayerName = this.players()[passPlayerNumber];
            var selectedCards = this.selectedCards();
            var data = {
                "card1": selectedCards[0],
                "card2": selectedCards[1],
                "card3": selectedCards[2]
            };
            var promise = $.post(
                serverAddress + gameLink + "/players/" + passPlayerName + "/passed_cards?ticket=" + authTicket,
                data);
            promise.done(function(data) {
                self.hand.removeAll(selectedCards);
                self.gameState("waiting-for-pass");
                // TODO: start waiting for cards to be passed to us
            });
            promise.fail(function() {
                alert("Failed to pass cards!");
            });
        };

        function fetchGameData() {
            var data = { "ticket": authTicket };

            // fetch hand
            var promise = $.get(
                serverAddress + gameLink + "/players/" + self.name + "/hand",
                data);
            promise.done(function(data) {
                var cards = data["cards"];
                self.hand(cards);
            });

            // fetch players list
            var playerPromise = $.get(serverAddress + gameLink + "/players");
            playerPromise.done(function(data) {
                var players = data["players"];
                self.players(players);
                self.playerNumber = players.indexOf(self.name);
            });
        }

        fetchGameData();
    }

    ko.components.register('queueView', {
        viewModel: QueueViewModel,
        template: { element: 'queueTemplate' }
    });

    ko.components.register('gameView', {
        viewModel: GameViewModel,
        template: { element: 'gameTemplate' }
    });

    ko.applyBindings(mainModel);
});


