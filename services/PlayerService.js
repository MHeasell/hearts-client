define(['jquery'], function($) {

    function PlayerService(serverAddress) {
        var self = this;

        this.createPlayer = function(name) {
            var data = { "name": name };
            return $.post(serverAddress + "/players", data);
        };
    }

    return PlayerService;
});