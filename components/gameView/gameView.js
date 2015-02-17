define(['jquery', 'knockout', 'text!./gameView.html'], function($, ko, tmpl) {

    var PILE_END_DELAY = 1000;

    function getSingularSuitName(suit) {
        switch (suit) {
            case "c":
                return "club";
            case "s":
                return "spade";
            case "d":
                return "diamond";
            case "h":
                return "heart";
        }
    }

    function containsSuit(cards, suit) {
        for (var i = 0; i < cards.length; i++) {
            var c = cards[i];
            if (parseCard(c).suit === suit) {
                return true;
            }
        }

        return false;
    }

    /**
     * Finds the winner of this pile of cards.
     *
     * @param cards {Array} An array of string "card" values.
     * There must be at least one card in the array.
     * @returns {Number} The index of the winning card.
     */
    function findWinningIndex(cards) {
        var parsedCards = cards.map(parseCard);

        var suit = parsedCards[0].suit;

        var winner = { index: -1, numericRank: 0 };
        for (var i = 0; i < parsedCards.length; i++) {
            var c = parsedCards[i];

            if (c.suit !== suit) {
                continue;
            }

            var numRank = convertToNumericRank(c.rank);
            if (numRank > winner.numericRank) {
                winner = { index: i, numericRank: numRank };
            }
        }

        return winner.index;
    }

    /**
     * Converts the given string rank into a sortable numeric value.
     * @param rank {String} The rank string
     * @returns {Number} The numeric representation of the rank.
     */
    function convertToNumericRank(rank) {
        switch (rank) {
            case "j":
                return 11;
            case "q":
                return 12;
            case "k":
                return 13;
            case "1":
                return 14;
            default:
                return parseInt(rank);
        }
    }

    function parseCard(val) {
        var suit = val.charAt(0);
        var rank = val.slice(1);

        return { suit: suit, rank: rank };
    }

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
            alert("end round");

            // TODO: calculate scores,
            // determine whether to continue playing
            // or if the game is over.
        }

        function endPile() {
            // figure out who won the pile
            var pileCards = self.pile().map(function(x) { return x.card; });
            var winIndex = findWinningIndex(pileCards);
            lastPileWinner = self.pile()[winIndex].player;

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

            var suit = parseCard(card).suit;
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

                var cardSuit = parseCard(val).suit;

                if (self.pile().length === 0 && !heartsBroken && cardSuit === "h") {
                    alert("Hearts has not been broken yet.");
                    return;
                }

                if (self.pile().length > 0) {
                    var pileSuit = parseCard(self.pile()[0].card).suit;
                    if (containsSuit(self.hand(), pileSuit) && cardSuit !== pileSuit) {
                        alert("You must play a " + getSingularSuitName(pileSuit));
                        return;
                    }
                }

                if (pileNumber === 1 && (cardSuit === "h" || val === "sq")) {
                    alert("You can't play a point card on the first trick.");
                    return;
                }

                service.addCardToPile(roundNumber, pileNumber, self.name, val, authTicket)
                    .done(function() {
                        self.hand.remove(val);
                        onReceiveNextPileCard(self.name, val);
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
            lastPileWinner = null;
            heartsBroken = false;

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
