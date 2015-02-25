require(['jquery', 'knockout', 'queueService', 'bootstrap'], function($, ko, QueueService) {

    $(function() {
        "use strict";

        var serverAddress = "http://192.168.1.12:5000";

        function MainModel() {

            this.componentInfo = ko.observable({
                name:'queueView',
                params: {
                    manager: this,
                    service: new QueueService(serverAddress)
                }
            });

            this.setComponent = function(name, params) {
                params.manager = this;
                mainModel.componentInfo({name: name, params: params});
            };
        }

        var mainModel = new MainModel();

        ko.components.register('queueView', { require: 'components/queueView/queueView' });
        ko.components.register('gameView', { require: 'components/gameView/gameView' });

        ko.applyBindings(mainModel);
    });

});
