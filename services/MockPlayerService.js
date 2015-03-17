define(['jquery'], function($) {

    function MockPlayerService(serverAddress) {
        var self = this;

        this.getPlayer = function(id) {
            var defer = $.Deferred();
            switch (id) {
                case 1:
                    defer.resolve({"id": 1, "name": "Steve"});
                    break;
                case 2:
                    defer.resolve({"id": 2, "name": "Joe"});
                    break;
                case 3:
                    defer.resolve({"id": 3, "name": "Alan"});
                    break;
                case 4:
                    defer.resolve({"id": 3, "name": "Bob"});
                    break;
                default:
                    defer.reject();
            }

            return defer.promise();
        };
    }

    return MockPlayerService;
});