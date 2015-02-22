define(['jquery', 'gameService'], function($, GameService) {

    var POLL_INTERVAL = 5000;

    function QueueService(serverAddress) {
        var self = this;

        this.joinQueue = function(name) {
            var data = { "name": name };
            return $.post(serverAddress + "/queue", data);
        };

        this.getQueueStatus = function(name, ticket) {
            var data = { "ticket": ticket };
            var encodedName = encodeURIComponent(name);
            return $.get(serverAddress + "/queue/" + encodedName, data);
        };

        this.createGameService = function(link) {
            return new GameService(serverAddress + link);
        };

        this.waitForGame = function(name, ticket) {
            var defer = $.Deferred();

            (function pollQueue() {
                self.getQueueStatus(name, ticket)
                    .done(function (data) {
                        if (data["matched"]) {
                            defer.resolve(data);
                        }
                        else {
                            setTimeout(pollQueue, POLL_INTERVAL);
                        }
                    })
                    .fail(function() {
                        defer.reject();
                    });
            })();

            return defer.promise();
        };
    }

    return QueueService;
});