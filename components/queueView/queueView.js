define(["jquery", "knockout", "text!./queueView.html"], function($, ko, tmpl) {

    function QueueViewModel(params) {
        this.name = ko.observable();

        this.password = ko.observable();

        this.state = ko.observable("ready");

        this.errorMessage = ko.observable(null);

        this.queueFormEnabled = ko.computed(function() {
            return this.state() === "ready";
        }, this);

        this.queueButtonLabel = ko.computed(function() {
            var state = this.state();
            if (state === "ready") {
                return "Queue for Game";
            }

            return "Queuing...";
        }, this);

        var self = this;

        var manager = params.manager;

        var connectFunction = params.connectFunction;

        var playerService = params.playerService;

        this.queue = function () {
            self.errorMessage(null);

            var promise = playerService.createPlayer(this.name(), this.password());
            this.state("sendingRequest");

            promise.done(function(data) {
                onCreatedPlayer(data["id"], data["name"], data["ticket"]);
            });

            promise.fail(function(xhr, textStatus) {
                if (xhr.status === 409) {
                    self.errorMessage("This name has already been taken.");
                }
                else {
                    self.errorMessage("Could not create your account. Please try again later.");
                }

                self.state("ready");
            });
        };

        function onCreatedPlayer(id, name, ticket) {
            var service = connectFunction();

            service.onConnect = function() {
                self.state("queuing");
                service.sendAuth(ticket)
                    .done(function() {
                        // Do nothing.
                        // The server will notify us when we get a game.
                    })
                    .fail(function() {
                        service.disconnect();
                    });
            };

            service.onDisconnect = function() {
                self.state("ready");
                self.errorMessage("Could not connect to the game server.");
            };

            service.onConnectedToGame = function() {
                manager.setComponent(
                    "gameView",
                    {
                        service: service,
                        playerService: playerService,
                        ticket: ticket,
                        id: id
                    });
            };
        }
    }

    return { viewModel: QueueViewModel, template: tmpl };
});
