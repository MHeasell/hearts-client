require(['jquery', 'knockout', 'services/PlayerService', 'services/GameService', 'mainModel', 'config', 'bootstrap'],
    function($, ko, PlayerService, GameService, MainModel, config) {

    $(function() {
        "use strict";

        ko.components.register('queueView', { require: 'components/queueView/queueView' });
        ko.components.register('gameView', { require: 'components/gameView/gameView' });

        var mainModel = new MainModel();

        var playerSvc = new PlayerService(config.serverAddress);
        var connectFunc = function() { return new GameService(config.wsServerAddress); };
        mainModel.setComponent('queueView', {
            manager: mainModel,
            playerService: playerSvc,
            connectFunction: connectFunc
        });

        ko.applyBindings(mainModel);
    });

});
