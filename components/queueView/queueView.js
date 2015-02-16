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

        var authTicket = null;

        var self = this;

        var manager = params.manager;

        var service = params.service;

        this.queue = function () {
            var promise = service.joinQueue(this.name());

            this.state("sendingRequest");

            promise.done(function(data) {
                onEnterQueue(data["ticket"]);
            });

            promise.fail(function() {
                self.state("ready");
            });
        };

        function onEnterQueue(ticket) {
            self.state("queuing");
            self.authTicket = ticket;

            service.waitForGame(self.name(), self.authTicket)
                .done(function(data) {
                    onFoundGame(data["link"]);
                })
                .fail(function() {
                    self.state("ready");
                });
        }

        function onFoundGame(link) {
            var gameSvc = service.createGameService(link);
            manager.setComponent(
                "gameView",
                {
                    service: gameSvc,
                    ticket: self.authTicket,
                    name: self.name()
                });
        }
    }

    return { viewModel: QueueViewModel, template: tmpl };
});
