require(["knockout", "services/MockGameService", "mainModel"],
function(ko, GameService, MainModel) {

    var model = new MainModel();

    var svc = new GameService();

    ko.components.register('gameView', { require: 'components/gameView/gameView' });

    model.setComponent('gameView',
        {
            service: svc,
            name: "Steve",
            password: "asdf"
        });

    ko.applyBindings(model);
});