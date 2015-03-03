require(['jquery', 'knockout', 'services/QueueService', 'mainModel', 'config', 'bootstrap'],
    function($, ko, QueueService, MainModel, config) {

    $(function() {
        "use strict";

        ko.components.register('queueView', { require: 'components/queueView/queueView' });
        ko.components.register('gameView', { require: 'components/gameView/gameView' });

        var mainModel = new MainModel();

        var svc = new QueueService(config.serverAddress);
        mainModel.setComponent('queueView', { manager: mainModel, service: svc });

        ko.applyBindings(mainModel);
    });

});
