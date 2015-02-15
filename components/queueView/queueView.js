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
                self.state("queuing");
                self.authTicket = data["ticket"];
                pollQueue();
            });

            promise.fail(function() {
                self.state("ready");
            });
        };

        function pollQueue() {
            setTimeout(function() {
                var promise = service.getQueueStatus(self.name(), self.authTicket);
                promise.done(function (data) {
                    if (data["matched"]) {
                        var gameSvc = service.createGameService(data["link"]);
                        manager.setComponent(
                            "gameView",
                            {
                                service: gameSvc,
                                ticket: self.authTicket,
                                name: self.name()
                            });
                    }
                    else {
                        pollQueue();
                    }
                });
                promise.fail(function() {
                    alert("Failed to poll queue!");
                });
            }, 5000);
        }
    }

    return { viewModel: QueueViewModel, template: tmpl };
});
