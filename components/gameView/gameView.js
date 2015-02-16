define(['jquery', 'knockout', 'text!./gameView.html'], function($, ko, tmpl) {

    var POLL_INTERVAL = 5000;
    var PILE_END_DELAY = 1000;

    function GameViewModel(params) {
        var self = this;

        this.hand = ko.observableArray();
        this.pile = ko.observableArray();

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

        var pileNumber = null;
        var nextCardNumber = null;

        function startPile() {
            if (pileNumber === null) {
                pileNumber = 1;
            }
            else {
                pileNumber += 1;
            }

            nextCardNumber = 1;

            // if we have the 2 of clubs, we must go first
            if (self.hand.indexOf("c2") !== -1) {
                self.gameState("our-turn");
            }
            else {
                waitForOtherPlayerMoves();
            }
        }

        function endRound() {
            alert("end round");
        }

        function endPile() {

            // TODO: figure out who won, add to score

            // wait a bit so the player can see the result
            setTimeout(function() {
                self.pile.removeAll();
                if (pileNumber === 13) {
                    endRound();
                }
                else {
                    startPile();
                }
            }, PILE_END_DELAY);
        }

        function getPlayerPositionDescription(playerName) {
            var positions = ["yours", "left", "across", "right"];

            var ourIndex = self.playerNumber;
            var otherIndex = self.players.indexOf(playerName);
            var diff = otherIndex - ourIndex;
            if (diff < 0) {
                diff += 4;
            }

            return positions[diff];
        }

        function waitForOtherPlayerMoves() {
            self.gameState("waiting-for-moves");

            service.waitForPileCard(pileNumber, nextCardNumber)
                .done(function(data) {
                    onReceiveNextPileCard(data["player"], data["card"]);
                })
                .fail(function() {
                    alert("Failed to get next pile card!");
                });
        }

        function onReceiveNextPileCard(playerName, card) {
            var pos = getPlayerPositionDescription(playerName);

            self.pile.push({
                "position": pos,
                "card": card
            });

            nextCardNumber += 1;

            if (self.pile().length === 4) {
                endPile();
            }
            else if (pos === "right") {
                self.gameState("our-turn");
            }
            else {
                waitForOtherPlayerMoves();
            }
        }

        this.confirmReceiveCards = function() {
            this.selectedCards.removeAll();
            startPile();
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
            else if (self.gameState() === "our-turn") {
                if (self.pile().length === 0 &&
                    self.hand.indexOf("c2") !== -1 &&
                    val !== "c2") {
                    alert("You must start with the 2 of clubs.");
                    return;
                }

                service.addCardToPile(pileNumber, self.name, val, authTicket)
                    .done(function() {
                        self.pile.push({ card: val, position: "yours" });
                        self.hand.remove(val);
                        nextCardNumber += 1;
                        if (self.pile().length === 4) {
                            endPile();
                        }
                        else {
                            waitForOtherPlayerMoves();
                        }
                    })
                    .fail(function() {
                        alert("Failed to play card!");
                    });
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
            }, POLL_INTERVAL);
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
