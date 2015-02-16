define(['jquery', 'knockout', 'text!./gameView.html'], function($, ko, tmpl) {

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

        this.passAvailable = ko.computed(function() {
            return this.gameState() === "passing";
        }, this);

        this.passEnabled = ko.computed(function() {
            return this.selectedCards().length === 3;
        }, this);

        this.confirmReceiveAvailable = ko.computed(function() {
            return this.gameState() === "confirm-receive-pass";
        }, this);

        var authTicket = params.ticket;
        var manager = params.manager;
        var service = params.service;

        function startRound() {
            alert("round start");
            // TODO: do start of round stuff,
            // e.g. figure out whose turn it is
            // and either allow the player to play a card
            // or wait for other players to play.
        }

        this.confirmReceiveCards = function() {
            this.selectedCards.removeAll();
            alert("cards confirmed!");
            startRound();
        };

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

            service.passCards(passPlayerName, selectedCards, authTicket)
                .done(function() {
                    self.hand.removeAll(selectedCards);
                    self.selectedCards.removeAll();
                    self.gameState("waiting-for-pass");
                    pollPassedCards();
                })
                .fail(function() {
                    alert("Failed to pass cards!");
                });
        };

        function receivePassedCards(cards) {
            self.hand.push.apply(self.hand, cards);
            self.selectedCards(cards);
            self.gameState("confirm-receive-pass");
        }

        function pollPassedCards() {
            setTimeout(function() {
                service.getPassedCards(self.name, authTicket)
                    .done(function(data) {
                        if (data["passed"]) {
                            receivePassedCards([data["card1"], data["card2"], data["card3"]]);
                        }
                        else {
                            pollPassedCards();
                        }
                    })
                    .fail(function() {
                        alert("Failed to poll for passed cards!");
                    });
            }, 5000);
        }

        function fetchGameData() {
            // fetch hand
            service.getHand(self.name, authTicket)
                .done(function(data) {
                    var cards = data["cards"];
                    self.hand(cards);
                })
                .fail(function() {
                    alert("Failed to get hand!");
                });

            // fetch players list
            service.getPlayers()
                .done(function(data) {
                    var players = data["players"];
                    self.players(players);
                    self.playerNumber = players.indexOf(self.name);
                });
        }

        fetchGameData();
    }

    return { viewModel: GameViewModel, template: tmpl };
});
