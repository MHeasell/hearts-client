define(['jquery'], function($) {

    function PlayerService(serverAddress) {
        var self = this;

        this.createPlayer = function(name, password) {
            var data = { "name": name, "password": password };
            return $.post(serverAddress + "/players", data);
        };
    }

    return PlayerService;
});