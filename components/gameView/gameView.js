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

        // Initialization/game state loading logic -----------------------------

        var playerId = params.id;
        var authTicket = params.ticket;
        var manager = params.manager;
        var service = params.service;
        var playerService = params.playerService;

        this.playerName = ko.observable();
        this.leftPlayerName = ko.observable();
        this.rightPlayerName = ko.observable();
        this.acrossPlayerName = ko.observable();

        this.playerIsConnected = ko.observable(false);
        this.leftPlayerIsConnected = ko.observable(false);
        this.rightPlayerIsConnected = ko.observable(false);
        this.acrossPlayerIsConnected = ko.observable(false);

        this.ourRoundScore = ko.observable();
        this.leftPlayerRoundScore = ko.observable();
        this.rightPlayerRoundScore = ko.observable();
        this.acrossPlayerRoundScore = ko.observable();

        this.leftPlayerTotalScore = ko.observable();
        this.rightPlayerTotalScore = ko.observable();
        this.acrossPlayerTotalScore = ko.observable();
        this.ourTotalScore = ko.observable();

        var playerIndex = 0;
        var leftPlayerIndex = 1;
        var rightPlayerIndex = 3;
        var acrossPlayerIndex = 2;

        var players = new Array(4);
        players[playerIndex] = this.playerName;
        players[leftPlayerIndex] = this.leftPlayerName;
        players[rightPlayerIndex] = this.rightPlayerName;
        players[acrossPlayerIndex] = this.acrossPlayerName;

        var playersConnected = new Array(4);
        playersConnected[playerIndex] = this.playerIsConnected;
        playersConnected[leftPlayerIndex] = this.leftPlayerIsConnected;
        playersConnected[rightPlayerIndex] = this.rightPlayerIsConnected;
        playersConnected[acrossPlayerIndex] = this.acrossPlayerIsConnected;

        var pointsScoredThisRound = new Array(4);
        pointsScoredThisRound[playerIndex] = this.ourRoundScore;
        pointsScoredThisRound[leftPlayerIndex] = this.leftPlayerRoundScore;
        pointsScoredThisRound[rightPlayerIndex] = this.rightPlayerRoundScore;
        pointsScoredThisRound[acrossPlayerIndex] = this.acrossPlayerRoundScore;

        var pointsScoredOverall = new Array(4);
        pointsScoredOverall[playerIndex] = this.ourTotalScore;
        pointsScoredOverall[leftPlayerIndex] = this.leftPlayerTotalScore;
        pointsScoredOverall[rightPlayerIndex] = this.rightPlayerTotalScore;
        pointsScoredOverall[acrossPlayerIndex] = this.acrossPlayerTotalScore;

        var isFirstTrick = false;

        var lastPileWinner = null;
        var heartsBroken = false;

        var currentRoundNumber = null;

        this.selectedCards = ko.observableArray();

        this.hand = ko.observableArray();

        this.pile = ko.observableArray();

        this.gameState = ko.observable("unloaded");

        this.leftPlayerCardCount = ko.observable(0);
        this.rightPlayerCardCount = ko.observable(0);
        this.acrossPlayerCardCount = ko.observable(0);

        this.errorMessage = ko.observable(null);

        function applyGameState(initialGameState) {

            playerIndex = initialGameState["players"].indexOf(playerId);
            leftPlayerIndex = (playerIndex + 1) % 4;
            rightPlayerIndex = (playerIndex + 3) % 4;
            acrossPlayerIndex = (playerIndex + 2) % 4;

            players[playerIndex] = self.playerName;
            players[leftPlayerIndex] = self.leftPlayerName;
            players[rightPlayerIndex] = self.rightPlayerName;
            players[acrossPlayerIndex] = self.acrossPlayerName;

            playersConnected[playerIndex] = self.playerIsConnected;
            playersConnected[leftPlayerIndex] = self.leftPlayerIsConnected;
            playersConnected[rightPlayerIndex] = self.rightPlayerIsConnected;
            playersConnected[acrossPlayerIndex] = self.acrossPlayerIsConnected;

            pointsScoredThisRound[playerIndex] = self.ourRoundScore;
            pointsScoredThisRound[leftPlayerIndex] = self.leftPlayerRoundScore;
            pointsScoredThisRound[rightPlayerIndex] = self.rightPlayerRoundScore;
            pointsScoredThisRound[acrossPlayerIndex] = self.acrossPlayerRoundScore;

            pointsScoredOverall[playerIndex] = self.ourTotalScore;
            pointsScoredOverall[leftPlayerIndex] = self.leftPlayerTotalScore;
            pointsScoredOverall[rightPlayerIndex] = self.rightPlayerTotalScore;
            pointsScoredOverall[acrossPlayerIndex] = self.acrossPlayerTotalScore;

            (function() {
                for (var i = 0; i < players.length; i++) {
                    var p = initialGameState["players"][i];
                    if (p !== null) {
                        playersConnected[i](true);
                        resolvePlayer(i, p);
                    }
                    else {
                        playersConnected[i](false);
                    }
                }
            })();

            if (initialGameState["state"] === "playing") {
                (function() {
                    for (var i = 0; i < pointsScoredThisRound.length; i++) {
                        pointsScoredThisRound[i](initialGameState["state_data"]["round_scores"][i]);
                    }
                })();
            }
            else {
                (function() {
                    for (var i = 0; i < pointsScoredThisRound.length; i++) {
                        pointsScoredThisRound[i](0);
                    }
                })();
            }

            (function() {
                for (var i = 0; i < pointsScoredOverall.length; i++) {
                    pointsScoredOverall[i](initialGameState["scores"][i]);
                }
            })();

            if (initialGameState["state"] === "playing") {
                heartsBroken = initialGameState["state_data"]["is_hearts_broken"];
                isFirstTrick = initialGameState["state_data"]["is_first_trick"];
            }

            if (initialGameState["state"] === "playing" ||
                initialGameState["state"] === "passing") {
                self.hand(
                    initialGameState["state_data"]["hand"]
                        .slice()
                        .sort(util.compareCards)
                );

                currentRoundNumber = initialGameState["state_data"]["round_number"];
            }

            if (initialGameState["state"] === "passing") {
                if (initialGameState["state_data"]["have_passed"]) {
                    self.hand.removeAll(initialGameState["state_data"]["passed_cards"]);
                }
            }

            if (initialGameState["state"] === "playing") {
                self.pile(
                    initialGameState["state_data"]["trick"]
                        .map(function(x) {
                            return {
                                card: x["card"],
                                position: indexToPosition(x["player"])
                            };
                        })
                );
            }

            self.gameState(
                gameToViewState(
                    initialGameState["state"],
                    initialGameState["state_data"],
                    playerIndex));

            (function() {
                var cardCount = self.hand().length;
                var pile = self.pile();
                self.leftPlayerCardCount(cardCount - (positionHasPlayed("left", pile) ? 1 : 0));
                self.acrossPlayerCardCount(cardCount - (positionHasPlayed("across", pile) ? 1 : 0));
                self.rightPlayerCardCount(cardCount - (positionHasPlayed("right", pile) ? 1 : 0));
            })();
        }

        // computed observables ------------------------------------------------

        this.statusMessage = ko.computed(function() {
            switch (this.gameState()) {
                case "init":
                    return "Waiting for the game to begin...";
                case "wait-for-round":
                    return "Waiting for the next round to start...";
                case "passing":
                    var passIdx = (playerIndex + util.getPassOffset(util.getPassDirection(currentRoundNumber))) % 4;
                    var passName = players[passIdx]();
                    return "Choose three cards to pass to " + passName + ".";
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
                    if (lastPileWinner === playerIndex) {
                        return "You win this trick.";
                    }
                    return players[lastPileWinner]() + " wins this trick.";
                case "game-over":
                    return "The game is over!";
                case "disconnected":
                    return "Lost connection to the game.";
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

        this.acrossPlayerIsGrayedOut = ko.computed(function() {
            return !this.acrossPlayerIsConnected();
        }, this);

        this.tableGrayedOut = ko.computed(function() {
            return this.gameState() === "disconnected";
        }, this);

        // utility functions ---------------------------------------------------

        function showError(msg) {
            self.errorMessage(msg);
        }

        function resolvePlayer(index, id) {
            players[index]("Player #" + id);
            playerService.getPlayer(id)
                .done(function(data) {
                    players[index](data["name"]);
                })
                .fail(function() {
                    console.log("Failed to get player name for: " + id);
                });
        }

        function changeState(newState) {
            self.errorMessage(null);
            self.gameState(newState);
        }

        function indexToPosition(playerIdx) {
            return offsetToPosition(playerIdx - playerIndex);
        }

        function getMoonShootingPlayerIndex() {
            for (var i = 0; i < pointsScoredThisRound.length; i++) {
                if (pointsScoredThisRound[i]() === 26) {
                    return i;
                }
            }

            return null;
        }

        function resetPointsScoredThisRound() {
            for (var i = 0; i < pointsScoredThisRound.length; i++) {
                pointsScoredThisRound[i](0);
            }
        }

        // service event handlers ----------------------------------------------

        service.onConnect = function() {};  // should not happen
        service.onError = function() {};
        service.onDisconnect = function() {
            if (self.gameState() !== "game-over") {
                changeState("disconnected");
            }
        };

        service.onStartRound = function(roundNumber, hand) {
            beginRound(roundNumber, hand);
        };

        service.onFinishPassing = function(receivedCards) {
            onReceivePassedCards(receivedCards);
        };

        service.onPlayCard = function(player, card) {
            if (player === playerIndex) {
                return;
            }

            onReceiveNextPileCard(player, card);
        };

        service.onPlayerConnected = function(playerIndex, playerId) {
            playersConnected[playerIndex](true);
            resolvePlayer(playerIndex, playerId);
        };

        service.onPlayerDisconnected = function(playerIndex) {
            playersConnected[playerIndex](false);
            players[playerIndex](null);
        };

        // game event functions ------------------------------------------------

        function startPile() {
            self.pile.removeAll();

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

        function endRound() {
            self.pile.removeAll();

            // check whether any of the players shot the moon
            var moonShootingPlayerIndex = getMoonShootingPlayerIndex();

            // add the scores on
            if (moonShootingPlayerIndex !== null) {
                addPointsToOverallExcept(26, moonShootingPlayerIndex);
            }
            else {
                addPointsFromRoundToOverall();
            }

            resetPointsScoredThisRound();

            // the game is over if someone gets to 100
            if (hasOverallScoreReachedOneHundred()) {
                endGame();
            }
            else {
                waitForRoundStart();
            }
        }

        function addPointsToOverallExcept(points, exceptIndex) {
            for (var i = 0; i < pointsScoredOverall.length; i++) {
                if (i === exceptIndex) {
                    continue; // no points for the excluded index
                }

                pointsScoredOverall[i](pointsScoredOverall[i]() + points);
            }
        }

        function addPointsFromRoundToOverall() {
            for (var i = 0; i < pointsScoredOverall.length; i++) {
                pointsScoredOverall[i](pointsScoredOverall[i]() + pointsScoredThisRound[i]());
            }
        }

        function hasOverallScoreReachedOneHundred() {
            for (var i = 0; i < pointsScoredOverall.length; i++) {
                var s = pointsScoredOverall[i]();
                if (s >= 100) {
                    return true;
                }
            }

            return false;
        }

        function endGame() {
            changeState("game-over");
        }

        function waitForRoundStart() {
            changeState("wait-for-round");
        }

        function endPile() {
            isFirstTrick = false;

            // figure out the winner
            var pile = self.pile();
            var cards = pile.map(function(x) { return x.card; });
            lastPileWinner = pile[util.findWinningIndex(cards)].player;

            // add points to the winning player's total
            var points = util.sumPoints(cards);
            var prevPoints = pointsScoredThisRound[lastPileWinner]();
            pointsScoredThisRound[lastPileWinner](prevPoints + points);

            changeState("view-trick-result");

            // wait a bit so the player can see the result,
            // then move on.
            setTimeout(function() {
                // Small hack to limit problems due to events happening
                // while we were waiting.
                // To be replaced with a proper system later.
                if (self.gameState() !== "view-trick-result") {
                    console.log("Game state changed before cleaning up trick.");
                    return;
                }

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

        function onReceivePassedCards(cards) {
            var hand = self.hand();
            hand.push.apply(hand, cards);
            hand.sort(util.compareCards);
            self.hand(hand);
            self.selectedCards(cards);
            changeState("confirm-receive-pass");

            setTimeout(function() {
                self.selectedCards.removeAll();
                startPlaying();
            }, PILE_END_DELAY);
        }

        function beginRound(roundNumber, hand) {
            resetPointsScoredThisRound();
            self.pile.removeAll();
            currentRoundNumber = roundNumber;

            hand.sort(util.compareCards);
            self.hand(hand);
            self.leftPlayerCardCount(13);
            self.rightPlayerCardCount(13);
            self.acrossPlayerCardCount(13);

            if (roundNumber % 4 === 3) {
                startPlaying();
            }
            else {
                startPassing();
            }
        }

        function startPassing() {
            changeState("passing");
        }

        function startPlaying() {
            lastPileWinner = null;
            heartsBroken = false;
            isFirstTrick = true;

            startPile();
        }

        // command handlers ----------------------------------------------------

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
                // * first trick, hand is entirely point cards.

                var promise = service.playCard(val);

                changeState("playing-move");
                var cardIndex = self.hand.indexOf(val);
                self.hand.splice(cardIndex, 1);

                promise.done(function() {
                    onReceiveNextPileCard(playerIndex, val);
                });
                promise.fail(function() {
                    console.log("Failed to play card!");
                    self.hand.splice(cardIndex, 0, val);
                    changeState("our-turn");
                });
            }
        };

        this.passCards = function() {
            var selectedCards = this.selectedCards();

            var promise = service.passCards(selectedCards);

            changeState("performing-pass");
            var cards = self.hand.removeAll(self.selectedCards());
            self.selectedCards.removeAll();

            promise.done(function() {
                changeState("waiting-for-pass");
            });
            promise.fail(function() {
                console.log("Failed to pass cards!");

                // put the cards back in the player's hand
                var tmpHand = self.hand().concat(cards);
                tmpHand.sort(util.compareCards);
                self.hand(tmpHand);

                changeState("passing");
            });
        };

        // game init logic -----------------------------------------------------

        service.requestGameState()
            .done(applyGameState)
            .fail(function() {
                showError("Failed to get game state!");
            });
    }

    return { viewModel: GameViewModel, template: tmpl };
});
