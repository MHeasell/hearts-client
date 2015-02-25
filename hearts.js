require(['jquery', 'knockout', 'queueService', 'mainModel', 'bootstrap'],
    function($, ko, QueueService, MainModel) {

    $(function() {
        "use strict";

        var serverAddress = "http://192.168.1.12:5000";

        ko.components.register('queueView', { require: 'components/queueView/queueView' });
        ko.components.register('gameView', { require: 'components/gameView/gameView' });

        var mainModel = new MainModel();

        var svc = new QueueService(serverAddress);
        mainModel.setComponent('queueView', { manager: mainModel, service: svc });

        ko.applyBindings(mainModel);
    });

});
