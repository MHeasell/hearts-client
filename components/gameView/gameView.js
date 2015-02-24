define(['jquery', 'knockout', 'text!./gameView.html', 'heartsUtil'],
    function($, ko, tmpl, util) {

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

        var lastPileWinner = null;
        var heartsBroken = false;
        var pointsScoredThisRound = {};

        var pointsScoredOverall = {};

        function startPile() {
            if (pileNumber === null) {
                pileNumber = 1;
            }
            else {
                pileNumber += 1;
            }

            nextCardNumber = 1;

            // if we have the 2 of clubs or we won the last pile,
            // we must go first
            if (self.hand.indexOf("c2") !== -1 ||
                lastPileWinner === self.name) {
                beginTurn();
            }
            else {
                waitForOtherPlayerMoves();
            }
        }

        function endRound() {

            // check whether any of the players shot the moon
            var shotMoon = false;
            for (var j = 0; j < self.players().length; j++) {
                var p = self.players()[j];
                if (pointsScoredThisRound[p] === 26) {
                    for (var k = 0; k < self.players().length; k++) {
                        var q = self.players()[k];
                        if (q === p) {
                            continue;
                        }

                        pointsScoredOverall[q] += 26;
                    }

                    shotMoon = true;
                    break;
                }
            }

            // otherwise do scoring as normal
            if (!shotMoon) {
                for (var i = 0; i < self.players().length; i++) {
                    var r = self.players()[i];
                    pointsScoredOverall[r] += pointsScoredThisRound[r];
                }
            }

            // the game is over if someone goes over 100
            for (var l = 0; l < self.players().length; l++) {
                var s = self.players()[l];
                if (pointsScoredOverall[s] >= 100) {
                    alert("Game over!");
                    return;
                }
            }

            // otherwise, begin a the next round
            beginRound();
        }

        function endPile() {
            // figure out who won the pile
            var pileCards = self.pile().map(function(x) { return x.card; });
            var winIndex = util.findWinningIndex(pileCards);
            lastPileWinner = self.pile()[winIndex].player;

            // add points to the winning player's total
            pointsScoredThisRound[lastPileWinner] += util.sumPoints(pileCards);

            // wait a bit so the player can see the result,
            // then clean up the table.
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

            var suit = util.parseCard(card).suit;
            if (suit === "h") {
                heartsBroken = true;
            }

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
                if (self.hand.indexOf("c2") !== -1 && val !== "c2") {
                    alert("You must start with the 2 of clubs.");
                    return;
                }

                var cardSuit = util.parseCard(val).suit;

                if (self.pile().length > 0) {
                    var pileSuit = util.parseCard(self.pile()[0].card).suit;
                    if (util.containsSuit(self.hand(), pileSuit) && cardSuit !== pileSuit) {
                        alert("You must play a " + util.getSingularSuitName(pileSuit));
                        return;
                    }
                }

                if (pileNumber === 1 && (cardSuit === "h" || val === "sq")) {
                    alert("You can't play a point card on the first trick.");
                    return;
                }

                if (self.pile().length === 0 && !heartsBroken && cardSuit === "h") {
                    alert("Hearts has not been broken yet.");
                    return;
                }

                // TODO: edge cases, e.g.
                // * hearts not broken, but no other suit available.
                // * first trick, hand is entirely point cards.

                self.gameState("playing-move");

                service.addCardToPile(roundNumber, pileNumber, self.name, val, authTicket)
                    .done(function() {
                        self.hand.remove(val);
                        onReceiveNextPileCard(self.name, val);
                    })
                    .fail(function() {
                        alert("Failed to play card!");
                        self.gameState("our-turn");
                    });
            }
        };

        this.passCards = function() {
            var passPlayerNumber = (this.playerNumber + 1) % 4;
            var passPlayerName = this.players()[passPlayerNumber];
            var selectedCards = this.selectedCards();

            this.gameState("performing-pass");
            service.passCards(roundNumber, passPlayerName, selectedCards, authTicket)
                .done(function() {
                    onPassedCards();
                })
                .fail(function() {
                    alert("Failed to pass cards!");
                    self.gameState("passing");
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
            lastPileWinner = null;
            heartsBroken = false;

            for (var i = 0; i < self.players().length; i++) {
                pointsScoredThisRound[self.players()[i]] = 0;
            }

            service.waitForHand(roundNumber, self.name, authTicket)
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

                    for (var i = 0; i < self.players().length; i++) {
                        pointsScoredOverall[self.players()[i]] = 0;
                    }

                    beginRound();
                });
        }

        beginGame();
    }

    return { viewModel: GameViewModel, template: tmpl };
});
