define(['jquery', 'mockGameService'], function($, MockGameService) {

    function MockQueueService(serverAddress) {

        this.joinQueue = function(name) {
            var defer = $.Deferred();
            defer.resolve({ "ticket": "dead-beef" });
            return defer.promise();
        };

        this.getQueueStatus = function(name, ticket) {
            var defer = $.Deferred();
            defer.resolve({ "matched": true, "link": "fake-link" });
            return defer.promise();
        };

        this.createGameService = function(link) {
            return new MockGameService();
        };

        this.waitForGame = function(name, ticket) {
            var defer = $.Deferred();
            defer.resolve({ "matched": true, "link": "fake-link" });
            return defer.promise();
        };
    }

    return MockQueueService;
});