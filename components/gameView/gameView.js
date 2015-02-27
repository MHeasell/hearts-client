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

        this.leftPlayer = ko.observable("Left");
        this.rightPlayer = ko.observable("Right");
        this.acrossPlayer = ko.observable("Across");
        this.leftPlayerCardCount = ko.observable(0);
        this.acrossPlayerCardCount = ko.observable(0);
        this.rightPlayerCardCount = ko.observable(0);

        this.leftPlayerRoundScore = ko.observable(0);
        this.rightPlayerRoundScore = ko.observable(0);
        this.acrossPlayerRoundScore = ko.observable(0);
        this.ourRoundScore = ko.observable(0);

        this.leftPlayerTotalScore = ko.observable(0);
        this.rightPlayerTotalScore = ko.observable(0);
        this.acrossPlayerTotalScore = ko.observable(0);
        this.ourTotalScore = ko.observable(0);

        this.errorMessage = ko.observable(null);

        this.statusMessage = ko.computed(function() {
            switch (this.gameState()) {
                case "passing":
                    return "Pass three cards.";
                case "confirm-receive-pass":
                    return "You have been passed these cards.";
                case "our-turn":
                    return "It's your turn. Play a card.";
                case "performing pass":
                    return "Passing cards...";
                case "waiting-for-pass":
                    return "Waiting to receive cards...";
                case "playing-move":
                    return "Playing card...";
                case "waiting-for-moves":
                    return "Waiting for other players to play a card...";
                case "view-trick-result":
                    return lastPileWinner + " wins this trick.";
                case "game-over":
                    return "The game is over!";
                default:
                    return null;
            }
        }, this);

        this.passAvailable = ko.computed(function() {
            return this.gameState() === "passing";
        }, this);

        this.passEnabled = ko.computed(function() {
            return this.selectedCards().length === 3;
        }, this);

        this.confirmReceiveAvailable = ko.computed(function() {
            return this.gameState() === "confirm-receive-pass";
        }, this);

        this.handIsSelectable = ko.computed(function() {
            var state = this.gameState();
            return state === "our-turn" || state === "passing";
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

        var nextEventNumber = 1;

        function showError(msg) {
            self.errorMessage(msg);
        }

        function changeState(newState) {
            self.errorMessage(null);
            self.gameState(newState);
        }

        function handleEvent(event) {
            switch (event.type) {
                case "round_start":
                    beginRound(event["round_number"]);
                    break;
                case "passing_completed":
                    onPassingCompleted(event["round_number"]);
                    break;
                case "play_card":
                    onPlayCardEvent(event["round_number"], event["pile_number"], event["card_number"], event.player, event.card);
                    break;
                default:
                    throw new Error("Invalid event type: " + event.type);
            }
        }

        function waitAndHandleNextEvent() {
            service.waitForEvent(nextEventNumber)
                .done(function (data) {
                    nextEventNumber += 1;
                    handleEvent(data);
                })
                .fail(function() {
                    showError("Failed to receive event!");
                });
        }

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

        function getMoonShootingPlayer() {
            for (var i = 0; i < self.players().length; i++) {
                var p = self.players()[i];
                if (pointsScoredThisRound[p] === 26) {
                    return p;
                }
            }

            return null;
        }

        function endRound() {
            // check whether any of the players shot the moon
            var moonShootingPlayer = getMoonShootingPlayer();

            // add the scores on
            if (moonShootingPlayer !== null) {
                for (var k = 0; k < self.players().length; k++) {
                    var q = self.players()[k];
                    if (q === moonShootingPlayer) {
                        continue; // no points for the shooting player
                    }

                    pointsScoredOverall[q] += 26;
                    addTotalPointsForDisplay(q, 26);
                }
            }
            else {
                for (var i = 0; i < self.players().length; i++) {
                    var r = self.players()[i];
                    pointsScoredOverall[r] += pointsScoredThisRound[r];
                    addTotalPointsForDisplay(r, pointsScoredThisRound[r]);
                }
            }

            // the game is over if someone goes over 100
            for (var l = 0; l < self.players().length; l++) {
                var s = self.players()[l];
                if (pointsScoredOverall[s] >= 100) {
                    changeState("game-over");
                    return;
                }
            }

            // otherwise, wait for the next round
            waitAndHandleNextEvent();
        }

        function addRoundPointsForDisplay(player, points) {
            var pos = getPlayerPositionDescription(player);
            switch (pos) {
                case "left":
                    self.leftPlayerRoundScore(self.leftPlayerRoundScore() + points);
                    break;
                case "right":
                    self.rightPlayerRoundScore(self.rightPlayerRoundScore() + points);
                    break;
                case "across":
                    self.acrossPlayerRoundScore(self.acrossPlayerRoundScore() + points);
                    break;
                case "yours":
                    self.ourRoundScore(self.ourRoundScore() + points);
                    break;
            }
        }

        function addTotalPointsForDisplay(player, points) {
            var pos = getPlayerPositionDescription(player);
            switch (pos) {
                case "left":
                    self.leftPlayerRoundScore(self.leftPlayerTotalScore() + points);
                    break;
                case "right":
                    self.rightPlayerRoundScore(self.rightPlayerTotalScore() + points);
                    break;
                case "across":
                    self.acrossPlayerRoundScore(self.acrossPlayerTotalScore() + points);
                    break;
                case "yours":
                    self.ourRoundScore(self.ourTotalScore() + points);
                    break;
            }
        }

        function endPile() {
            // figure out who won the pile
            var pileCards = self.pile().map(function(x) { return x.card; });
            var winIndex = util.findWinningIndex(pileCards);
            lastPileWinner = self.pile()[winIndex].player;

            // add points to the winning player's total
            var trickScore = util.sumPoints(pileCards);
            pointsScoredThisRound[lastPileWinner] += trickScore;

            addRoundPointsForDisplay(lastPileWinner, trickScore);

            changeState("view-trick-result");

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
            changeState("waiting-for-moves");
            waitAndHandleNextEvent();
        }

        function beginTurn() {
            changeState("our-turn");
        }

        function onPlayCardEvent(rNumber, pNumber, cNumber, player, card) {
            if (rNumber !== roundNumber) {
                return;
            }

            if (pNumber !== pileNumber) {
                return;
            }

            if (self.pile().length + 1 !== cNumber) {
                return;
            }

            onReceiveNextPileCard(player, card);
        }

        function onReceiveNextPileCard(playerName, card) {
            var pos = getPlayerPositionDescription(playerName);

            self.pile.push({
                "position": pos,
                "player": playerName,
                "card": card
            });

            switch (pos) {
                case "left":
                    self.leftPlayerCardCount(self.leftPlayerCardCount() - 1);
                    break;
                case "right":
                    self.rightPlayerCardCount(self.rightPlayerCardCount() - 1);
                    break;
                case "across":
                    self.acrossPlayerCardCount(self.acrossPlayerCardCount() - 1);
                    break;
            }

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
                    showError("You must start with the 2 of clubs.");
                    return;
                }

                var cardSuit = util.parseCard(val).suit;

                if (self.pile().length > 0) {
                    var pileSuit = util.parseCard(self.pile()[0].card).suit;
                    if (util.containsSuit(self.hand(), pileSuit) && cardSuit !== pileSuit) {
                        showError("You must play a " + util.getSingularSuitName(pileSuit));
                        return;
                    }
                }

                if (pileNumber === 1 && (cardSuit === "h" || val === "sq")) {
                    showError("You can't play a point card on the first trick.");
                    return;
                }

                if (self.pile().length === 0 && !heartsBroken && cardSuit === "h") {
                    showError("Hearts has not been broken yet.");
                    return;
                }

                // TODO: edge cases, e.g.
                // * hearts not broken, but no other suit available.
                // * first trick, hand is entirely point cards.

                changeState("playing-move");

                service.addCardToPile(roundNumber, pileNumber, self.name, val, authTicket)
                    .done(function() {
                        self.hand.remove(val);
                        waitAndHandleNextEvent();
                    })
                    .fail(function() {
                        changeState("our-turn");
                        showError("Failed to play card!");
                    });
            }
        };

        this.passCards = function() {
            var passPlayerOffset = util.getPassOffset(util.getPassDirection(roundNumber));
            var passPlayerNumber = (this.playerNumber + passPlayerOffset) % 4;
            var passPlayerName = this.players()[passPlayerNumber];
            var selectedCards = this.selectedCards();

            changeState("performing-pass");
            service.passCards(roundNumber, passPlayerName, selectedCards, authTicket)
                .done(function() {
                    onPassedCards();
                })
                .fail(function() {
                    changeState("passing");
                    showError("Failed to pass cards!");
                });
        };

        function onPassedCards() {
            self.hand.removeAll(self.selectedCards());
            self.selectedCards.removeAll();
            changeState("waiting-for-pass");
            waitAndHandleNextEvent();
        }

        function onPassingCompleted(number) {
            if (number !== roundNumber) {
                // ignore irrelevant events
                return;
            }

            service.getPassedCards(roundNumber, self.name, authTicket)
                .done(function(data) {
                    onReceivePassedCards(data["cards"]);
                })
                .fail(function() {
                    showError("Failed to receive passed cards!");
                });
        }

        function onReceivePassedCards(cards) {
            var hand = self.hand();
            hand.push.apply(hand, cards);
            hand.sort(util.compareCards);
            self.hand(hand);
            self.selectedCards(cards);
            changeState("confirm-receive-pass");
        }

        function onReceiveHand(cards) {
            cards.sort(util.compareCards);
            self.hand(cards);
            self.leftPlayerCardCount(13);
            self.rightPlayerCardCount(13);
            self.acrossPlayerCardCount(13);
            changeState("passing");
        }

        function beginRound(number) {
            if (number !== roundNumber + 1) {
                // ignore irrelevant events
                return;
            }

            roundNumber += 1;
            lastPileWinner = null;
            heartsBroken = false;

            for (var i = 0; i < self.players().length; i++) {
                pointsScoredThisRound[self.players()[i]] = 0;
            }

            service.getHand(roundNumber, self.name, authTicket)
                .done(function(data) {
                    onReceiveHand(data["cards"]);
                })
                .fail(function() {
                    showError("Failed to get hand!");
                });

        }

        function beginGame() {
            // fetch players list
            service.getPlayers()
                .done(function(data) {
                    var players = data["players"];
                    self.players(players);
                    self.playerNumber = players.indexOf(self.name);

                    self.leftPlayer(players[(self.playerNumber + 1) % 4]);
                    self.rightPlayer(players[(self.playerNumber + 3) % 4]);
                    self.acrossPlayer(players[(self.playerNumber + 2) % 4]);

                    for (var i = 0; i < self.players().length; i++) {
                        pointsScoredOverall[self.players()[i]] = 0;
                    }
                });

            waitAndHandleNextEvent();
        }

        beginGame();
    }

    return { viewModel: GameViewModel, template: tmpl };
});
