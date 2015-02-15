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

        this.queue = function () {
            var data = { "name": this.name() };
            var promise = $.post(manager.serverAddress + "/queue", data);
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
                var data = {"ticket": self.authTicket};
                var promise = $.get(manager.serverAddress + "/queue/" + self.name(), data);
                promise.done(function (data) {
                    if (data["matched"]) {
                        var gameLink = data["link"];
                        manager.setComponent("gameView", { link: gameLink, ticket: self.authTicket, name: self.name() });
                    }
                    else {
                        pollQueue();
                    }
                });
            }, 5000);
        }
    }

    return { viewModel: QueueViewModel, template: tmpl };
});
