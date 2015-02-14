
var serverAddress = "http://192.168.254.134:5000";

var queueAddress = serverAddress + "/queue";

$(function() {
    var $queueButton = $("#queueButton");
    var $queueLoadingLabel = $("#queueLoadingLabel");
    var $gameView = $("#gameView");
    var $welcomeView = $("#welcomeView");
    var $playerNameInput = $("#playerNameInput");

    var $playersList = $("#playersList");
    var $playerHand = $("#playerHand");

    var $passButton = $("#passButton");

    var playerName;

    var players;
    var ourPlayerNumber;

    var authTicket;

    var gameLink;

    var gameState = "passing";

    var selectedCards = [];

    $queueButton.click(function() {
        var name = $playerNameInput.val();
        var data = { "name": name };
        var promise = $.post(serverAddress + "/queue", data);
        promise.done(function(data) {
            $queueButton.prop("disabled", true);
            $queueLoadingLabel.show();
            playerName = name;
            authTicket = data["ticket"];
            pollQueue();
        });
    });

    function pollQueue() {
        setTimeout(function() {
            var data = {"ticket": authTicket};
            var promise = $.get(queueAddress + "/" + playerName, data);
            promise.done(function (data) {
                if (data["matched"]) {
                    gameLink = data["link"];
                    goToGameState();
                }
                else {
                    pollQueue();
                }
            });
        }, 5000);
    }

    function goToGameState() {
        $welcomeView.hide();
        $gameView.show();
        fetchGameData();
    }

    function cardClick() {
        var val = $(this).data("value");
        if (gameState == "passing") {
            var idx = selectedCards.indexOf(val);
            if (idx >= 0) {
                selectedCards.splice(idx, 1);
                $(this).removeClass("selected");
            }
            else {
                selectedCards.push(val);
                $(this).addClass("selected");
            }

            $passButton.prop("disabled", selectedCards.length != 3);
        }
    }

    $passButton.click(function() {
        var passPlayerNumber = (ourPlayerNumber + 1) % 4;
        var passPlayerName = players[passPlayerNumber];
        var data = { "card1": selectedCards[0], "card2": selectedCards[1], "card3": selectedCards[2] };
        var promise = $.post(serverAddress + gameLink + "/players/" + passPlayerName + "/passed_cards?ticket=" + authTicket, data);
        promise.done(function(data) {
            alert("you passed some cards");
        });
    });

    function fetchGameData() {
        var data = { "ticket": authTicket };
        var promise = $.get(serverAddress + gameLink + "/players/" + playerName + "/hand", data);
        promise.done(function(data) {
            var cards = data["cards"];
            $playerHand.empty();
            for (var i = 0; i < cards.length; i++) {
                var c = cards[i];
                var $card = $('<li></li>');
                $card.addClass("card");
                $card.addClass("card-" + c);
                $card.data("value", c);
                $card.click(cardClick);
                $playerHand.append($card);
            }
        });

        var playerPromise = $.get(serverAddress + gameLink + "/players");
        playerPromise.done(function(data) {
            players = data["players"];
            ourPlayerNumber = players.indexOf(playerName);
            $playersList.empty();
            for (var i = 0; i < players.length; i++) {
                $playersList.append('<li>'+players[i]+'</li>');
            }
        });
    }
});


