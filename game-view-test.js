require(["knockout", "services/MockGameService", "services/MockPlayerService", "mainModel"],
function(ko, GameService, PlayerService, MainModel) {

    var model = new MainModel();

    var svc = new GameService();
    var playerSvc = new PlayerService();

    ko.components.register('gameView', { require: 'components/gameView/gameView' });

    model.setComponent('gameView',
        {
            service: svc,
            playerService: playerSvc,
            ticket: "fake-ticket",
            id: 1
        });

    ko.applyBindings(model);
});