define(['jquery', 'gameService'], function($, GameService) {

    function QueueService(serverAddress) {

        this.joinQueue = function(name) {
            var data = { "name": name };
            return $.post(serverAddress + "/queue", data);
        };

        this.getQueueStatus = function(name, ticket) {
            var data = { "ticket": ticket };
            return $.get(serverAddress + "/queue/" + name, data);
        };

        this.createGameService = function(link) {
            return new GameService(serverAddress + link);
        };
    }

    return QueueService;
});