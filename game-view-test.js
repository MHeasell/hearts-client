require(["knockout", "services/MockGameService", "mainModel"],
function(ko, GameService, MainModel) {

    var model = new MainModel();

    var svc = new GameService();

    ko.components.register('gameView', { require: 'components/gameView/gameView' });

    model.setComponent('gameView',
        {
            manager: model,
            service: svc,
            ticket: "fake-ticket",
            name: "Joe"
        });

    ko.applyBindings(model);
});