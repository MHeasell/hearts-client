define(["jquery", "knockout", "text!./queueView.html"], function($, ko, tmpl) {

    function QueueViewModel(params) {
        this.name = ko.observable("Steve");

        this.state = ko.observable("ready");

        this.canEditPlayerName = ko.computed(function() {
            return this.state() === "ready";
        }, this);

        this.queueButtonEnabled = ko.computed(function() {
            return this.state() === "ready";
        }, this);

        this.showLoadingMessage = ko.computed(function() {
            return this.state() === "queuing";
        }, this);

        var self = this;

        var manager = params.manager;

        var connectFunction = params.connectFunction;

        var playerService = params.playerService;

        this.queue = function () {

            var promise = playerService.createPlayer(this.name());
            this.state("sendingRequest");

            promise.done(function(data) {
                onCreatedPlayer(data["id"], data["name"], data["ticket"]);
            });

            promise.fail(function() {
                self.state("ready");
            });
        };

        function onCreatedPlayer(id, name, ticket) {
            var service = connectFunction();

            service.onConnect = function() {
                self.state("queuing");
                service.sendAuth(ticket)
                    .done(function() {
                        // do nothing,
                        // the server will send us game state immediately.
                    })
                    .fail(function() {
                        service.disconnect();
                    });
            };

            service.onDisconnect = function() {
                self.state("ready");
            };

            service.onConnectedToGame = function(data) {
                manager.setComponent(
                    "gameView",
                    {
                        service: service,
                        ticket: ticket,
                        id: id,
                        name: self.name(),
                        state: data
                    });
            };
        }
    }

    return { viewModel: QueueViewModel, template: tmpl };
});
