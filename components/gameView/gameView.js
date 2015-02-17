define(['jquery', 'knockout', 'text!./gameView.html'], function($, ko, tmpl) {

    var PILE_END_DELAY = 1000;

    function GameViewModel(params) {
        var self = this;

        this.hand = ko.observableArray();
        this.pile = ko.observableArray();

        this.players = ko.observableArray();

        this.selectedCards = ko.observableArray();

        this.gameState = ko.observable("init");

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
        var roundNumber = 0;

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
                beginTurn();
            }
            else {
                waitForOtherPlayerMoves();
            }
        }

        function endRound() {
            alert("end round");

            // TODO: calculate scores,
            // determine whether to continue playing
            // or if the game is over.
        }

        function endPile() {

            // TODO: figure out who won and who starts next round

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

            service.waitForPileCard(roundNumber, pileNumber, nextCardNumber)
                .done(function(data) {
                    onReceiveNextPileCard(data["player"], data["card"]);
                })
                .fail(function() {
                    alert("Failed to get next pile card!");
                });
        }

        function beginTurn() {
            self.gameState("our-turn");
        }

        function onReceiveNextPileCard(playerName, card) {
            var pos = getPlayerPositionDescription(playerName);

            self.pile.push({
                "position": pos,
                "player": playerName,
                "card": card
            });

            nextCardNumber += 1;

            if (self.pile().length === 4) {
                endPile();
            }
            else if (pos === "right") {
                beginTurn();
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

                service.addCardToPile(roundNumber, pileNumber, self.name, val, authTicket)
                    .done(function() {
                        self.pile.push({ card: val, player: self.name, position: "yours" });
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

            service.passCards(roundNumber, passPlayerName, selectedCards, authTicket)
                .done(function() {
                    onPassedCards();
                })
                .fail(function() {
                    alert("Failed to pass cards!");
                });
        };

        function onPassedCards() {
            self.hand.removeAll(self.selectedCards());
            self.selectedCards.removeAll();
            self.gameState("waiting-for-pass");

            service.waitForPassedCards(roundNumber, self.name, authTicket)
                .done(function(data) {
                    onReceivePassedCards(data["cards"]);
                })
                .fail(function() {
                    alert("Failed to receive passed cards!");
                });
        }

        function onReceivePassedCards(cards) {
            self.hand.push.apply(self.hand, cards);
            self.selectedCards(cards);
            self.gameState("confirm-receive-pass");
        }

        function onReceiveHand(cards) {
            self.hand(cards);
            self.gameState("passing");
        }

        function beginRound() {
            roundNumber += 1;

            // TODO: poll for hand.
            // We might query for it before the first round has started,
            // in which case we'll get a 404, so we need to wait for it.
            service.getHand(roundNumber, self.name, authTicket)
                .done(function(data) {
                    onReceiveHand(data["cards"]);
                })
                .fail(function() {
                    alert("Failed to get hand!");
                });

        }

        function beginGame() {
            // fetch players list
            service.getPlayers()
                .done(function(data) {
                    var players = data["players"];
                    self.players(players);
                    self.playerNumber = players.indexOf(self.name);

                    beginRound();
                });
        }

        beginGame();
    }

    return { viewModel: GameViewModel, template: tmpl };
});
