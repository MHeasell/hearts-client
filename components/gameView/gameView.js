define(['jquery', 'knockout', 'text!./gameView.html', 'heartsUtil'],
    function($, ko, tmpl, util) {

    var PILE_END_DELAY = 1000;

    function offsetToPosition(offset) {
        var positions = ["yours", "left", "across", "right"];
        offset = ((offset % 4) + 4) % 4;
        return positions[offset];
    }

    function positionHasPlayed(pos, pile) {
        for (var i = 0; i < pile.length; i++) {
            var p = pile[i];
            if (p.position === pos) {
                return true;
            }
        }

        return false;
    }

        function isAllHearts(hand) {
            for (var i = 0; i < hand.length; i++) {
                if (util.parseCard(hand[i]).suit !== "h") {
                    return false;
                }
            }

            return true;
        }

    function gameToViewState(state, data, playerIndex) {
        switch (state) {
            case "init":
                return "init";
            case "passing":
                if (data["have_passed"]) {
                    return "waiting-for-pass";
                }

                return "passing";

            case "playing":
                if (data["current_player"] === playerIndex) {
                    return "our-turn";
                }

                return "waiting-for-moves";
        }
    }

    function GameViewModel(params) {
        var self = this;

        var playerId = params.id;
        var authTicket = params.ticket;
        var manager = params.manager;
        var service = params.service;
        var initialGameState = params.state;

        var players = initialGameState["players"];
        var playerIndex = players.indexOf(playerId);
        var leftPlayerIndex = (playerIndex + 1) % 4;
        var rightPlayerIndex = (playerIndex + 3) % 4;
        var acrossPlayerIndex = (playerIndex + 2) % 4;

        var isFirstTrick = false;

        this.name = params.name;

        var lastPileWinner = null;
        var heartsBroken = false;
        if (initialGameState["state"] === "playing") {
            heartsBroken = initialGameState["state_data"]["is_hearts_broken"];
        }

        var pointsScoredThisRound = [
            ko.observable(0),
            ko.observable(0),
            ko.observable(0),
            ko.observable(0)
        ];

        (function () {
            if (initialGameState["state"] === "playing") {
                var points = initialGameState["state_data"]["round_scores"];
                for (var i = 0; i < points.length; i++) {
                    pointsScoredThisRound[i](points[i]);
                }
            }
        })();

        var pointsScoredOverall = [
            ko.observable(0),
            ko.observable(0),
            ko.observable(0),
            ko.observable(0)
        ];

        (function() {
            var points = initialGameState["scores"];
            for (var i = 0; i < points.length; i++) {
                pointsScoredOverall[i](points[i]);
            }
        })();

        this.selectedCards = ko.observableArray();

        this.hand = ko.observableArray();

        (function() {
            if (initialGameState["state"] === "playing" || initialGameState["state"] === "passing") {
                var hand = initialGameState["state_data"]["hand"].slice();
                hand.sort(util.compareCards);
                self.hand(hand);
            }
        })();

        this.pile = ko.observableArray();

        if (initialGameState["state"] === "playing") {
            this.pile(translatePile(initialGameState["state_data"]["trick"]));
        }

        this.gameState = ko.observable(
            gameToViewState(
                initialGameState["state"],
                initialGameState["state_data"],
                playerIndex));

        this.leftPlayer = ko.observable(players[leftPlayerIndex]);
        this.rightPlayer = ko.observable(players[rightPlayerIndex]);
        this.acrossPlayer = ko.observable(players[acrossPlayerIndex]);

        (function() {
            var cardCount = self.hand().length;
            var pile = self.pile();
            self.leftPlayerCardCount = ko.observable(cardCount - (positionHasPlayed("left", pile) ? 1 : 0));
            self.acrossPlayerCardCount = ko.observable(cardCount - (positionHasPlayed("across", pile) ? 1 : 0));
            self.rightPlayerCardCount = ko.observable(cardCount - (positionHasPlayed("right", pile) ? 1 : 0));
        })();

        this.leftPlayerRoundScore = pointsScoredThisRound[leftPlayerIndex];
        this.rightPlayerRoundScore = pointsScoredThisRound[rightPlayerIndex];
        this.acrossPlayerRoundScore = pointsScoredThisRound[acrossPlayerIndex];
        this.ourRoundScore = pointsScoredThisRound[playerIndex];

        this.leftPlayerTotalScore = pointsScoredOverall[leftPlayerIndex];
        this.rightPlayerTotalScore = pointsScoredOverall[rightPlayerIndex];
        this.acrossPlayerTotalScore = pointsScoredOverall[acrossPlayerIndex];
        this.ourTotalScore = pointsScoredOverall[playerIndex];

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

        this.handIsSelectable = ko.computed(function() {
            var state = this.gameState();
            return state === "our-turn" || state === "passing";
        }, this);

        function translatePile(pile) {
            pile.map(function(x) {
                return {
                    card: x["card"],
                    position: indexToPosition(x["player"])
                };
            });
        }

        function showError(msg) {
            self.errorMessage(msg);
        }

        function changeState(newState) {
            self.errorMessage(null);
            self.gameState(newState);
        }

        function indexToPosition(playerIdx) {
            return offsetToPosition(playerIdx - playerIndex);
        }

        service.onConnect = function() {};
        service.onError = function() {};
        service.onDisconnect = function() {
            changeState("disconnected");
        };

        service.onReceiveGameState = function() {};

        service.onStartPreround = function(hand, passDirection) {
            beginRound(hand, passDirection);
        };

        service.onFinishPreround = function(receivedCards) {
            onReceivePassedCards(receivedCards);
        };

        service.onStartPlaying = function(hand) {
            hand.sort(util.compareCards);
            self.hand(hand);
            self.selectedCards.removeAll();
            isFirstTrick = true;
            startPile();
        };

        service.onPlayCard = function(playerIndex, card) {
            onReceiveNextPileCard(playerIndex, card);
        };

        service.onFinishTrick = function(winner, points) {
            endPile(winner, points);
        };

        function startPile() {
            // if we have the 2 of clubs or we won the last pile,
            // we must go first
            if (self.hand.indexOf("c2") !== -1 ||
                lastPileWinner === playerIndex) {
                beginTurn();
            }
            else {
                waitForOtherPlayerMoves();
            }
        }

        function getMoonShootingPlayerIndex() {
            for (var i = 0; i < pointsScoredThisRound.length; i++) {
                if (pointsScoredThisRound[i]() === 26) {
                    return i;
                }
            }

            return null;
        }

        function endRound() {
            // check whether any of the players shot the moon
            var moonShootingPlayerIndex = getMoonShootingPlayerIndex();

            // add the scores on
            if (moonShootingPlayerIndex !== null) {
                for (var k = 0; k < self.players.length; k++) {
                    if (k === moonShootingPlayerIndex) {
                        continue; // no points for the shooting player
                    }

                    pointsScoredOverall[k](pointsScoredOverall[k]() + 26);
                }
            }
            else {
                for (var i = 0; i < pointsScoredOverall.length; i++) {
                    pointsScoredOverall[i](pointsScoredOverall[i]() + pointsScoredThisRound[i]());
                }
            }

            // the game is over if someone goes over 100
            for (var l = 0; l < self.players().length; l++) {
                var s = self.players()[l];
                if (pointsScoredOverall[s]() >= 100) {
                    changeState("game-over");
                    return;
                }
            }
        }

        function endPile(winIndex, points) {
            isFirstTrick = false;
            lastPileWinner = winIndex;

            // add points to the winning player's total
            pointsScoredThisRound[lastPileWinner](pointsScoredThisRound[lastPileWinner]() + points);

            changeState("view-trick-result");

            // wait a bit so the player can see the result,
            // then clean up the table.
            setTimeout(function() {
                self.pile.removeAll();
                if (self.hand().length === 0) {
                    endRound();
                }
                else {
                    startPile();
                }
            }, PILE_END_DELAY);
        }

        function waitForOtherPlayerMoves() {
            changeState("waiting-for-moves");
        }

        function beginTurn() {
            changeState("our-turn");
        }

        function onReceiveNextPileCard(player, card) {
            var pos = indexToPosition(player);

            self.pile.push({
                "position": pos,
                "player": player,
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

            var suit = util.parseCard(card).suit;
            if (suit === "h") {
                heartsBroken = true;
            }

            else if (pos === "right" && self.pile().length < 4) {
                beginTurn();
            }
            else {
                waitForOtherPlayerMoves();
            }
        }

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

                if (isFirstTrick && (cardSuit === "h" || val === "sq")) {
                    showError("You can't play a point card on the first trick.");
                    return;
                }

                if (self.pile().length === 0 && !heartsBroken && cardSuit === "h" && !isAllHearts(self.hand())) {
                    showError("Hearts has not been broken yet.");
                    return;
                }

                // TODO: edge cases, e.g.
                // * hearts not broken, but no other suit available.
                // * first trick, hand is entirely point cards.

                changeState("playing-move");

                service.playCard(val);
                self.hand.remove(val);
            }
        };

        this.passCards = function() {
            var selectedCards = this.selectedCards();
            service.passCards(selectedCards);
            self.hand.removeAll(self.selectedCards());
            self.selectedCards.removeAll();
            changeState("waiting-for-pass");
        };

        function onReceivePassedCards(cards) {
            var hand = self.hand();
            hand.push.apply(hand, cards);
            hand.sort(util.compareCards);
            self.hand(hand);
            self.selectedCards(cards);
            changeState("confirm-receive-pass");
        }

        function beginRound(hand, passDirection) {
            lastPileWinner = null;
            heartsBroken = false;

            pointsScoredThisRound = [0, 0, 0, 0];

            hand.sort(util.compareCards);
            self.hand(hand);
            self.leftPlayerCardCount(13);
            self.rightPlayerCardCount(13);
            self.acrossPlayerCardCount(13);
            changeState("passing");
        }
    }

    return { viewModel: GameViewModel, template: tmpl };
});
