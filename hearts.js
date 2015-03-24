require(['jquery', 'knockout', 'services/GameService', 'mainModel', 'config', 'bootstrap'],
    function($, ko, GameService, MainModel, config) {

    $(function() {
        "use strict";

        ko.components.register('queueView', { require: 'components/queueView/queueView' });
        ko.components.register('gameView', { require: 'components/gameView/gameView' });

        var mainModel = new MainModel();

        var connectFunc = function() { return new GameService(config.wsServerAddress); };
        mainModel.setComponent('queueView', {
            manager: mainModel,
            connectFunction: connectFunc
        });

        ko.applyBindings(mainModel);
    });

});
