define(["jquery", "knockout", "text!./queueView.html"], function($, ko, tmpl) {

    function QueueViewModel(params) {
        this.name = ko.observable("");

        this.password = ko.observable("");

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

        this.queue = function() {
            self.errorMessage(null);

            var name = this.name();
            var password = this.password();

            name = name.trim();

            if (name.length < 1) {
                self.errorMessage("A name is required.");
                return;
            }

            if (name.length > 20) {
                self.errorMessage("Your name is too long. Try something shorter.");
                return;
            }

            self.state("queuing");

            var service = connectFunction();

            service.onConnect = function() {
                service.sendAuth(name, password)
                    .done(function() {
                        // Do nothing.
                        // The server will notify us when we get a game.
                    })
                    .fail(function() {
                        self.errorMessage("That name is in use and your password did not match.");
                        service.disconnect();
                    });
            };

            service.onError = function() {
                self.errorMessage("There was a problem connecting to the game server.");
            };

            service.onDisconnect = function() {
                if (self.errorMessage() === null) {
                    self.errorMessage("Lost connection to the game server.");
                }

                self.state("ready");
            };

            service.onConnectedToGame = function() {
                manager.setComponent(
                    "gameView",
                    {
                        service: service,
                        name: name,
                        password: password
                    });
            };
        };
    }

    return { viewModel: QueueViewModel, template: tmpl };
});
