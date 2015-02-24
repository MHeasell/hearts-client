define(['jquery', 'components/queueView/queueView'], function($, queueView) {
    var Model = queueView.viewModel;

    describe('Queue view model', function() {

        var svc = null;
        var model = null;
        var manager = null;

        beforeEach(function() {
            manager = jasmine.createSpyObj('manager', ['setComponent']);
            svc = jasmine.createSpyObj('service', ['joinQueue', 'waitForGame', 'createGameService']);

            var params = { manager: manager, service: svc };
            model = new Model(params);
        });

        it('starts with the name as Steve', function() {
            expect(model.name()).toEqual("Steve");
        });

        it('starts with the queue button enabled', function() {
            expect(model.queueButtonEnabled()).toEqual(true);
        });

        it('starts with the name field editable', function() {
            expect(model.canEditPlayerName()).toEqual(true);
        });

        describe('when the queue button is pressed', function() {

            var queueDefer = null;

            beforeEach(function() {
                queueDefer = $.Deferred();
                svc.joinQueue.and.returnValue(queueDefer);
            });

            it('calls the service joinQueue method', function() {
                model.queue();
                expect(svc.joinQueue).toHaveBeenCalled();
            });

            it('disables the queue button', function() {
                model.queue();
                expect(model.queueButtonEnabled()).toEqual(false);
            });

            it('disables editing the player name', function() {
                model.queue();
                expect(model.canEditPlayerName()).toEqual(false);
            });

            describe('when we successfully join the queue', function() {

                var gameDefer = null;

                beforeEach(function() {
                    gameDefer = $.Deferred();
                    svc.waitForGame.and.returnValue(gameDefer);
                });

                it('waits for a game using the given name and ticket', function() {
                    model.name("Jimbob");
                    model.queue();
                    queueDefer.resolve({ ticket: "fake-ticket" });

                    expect(svc.waitForGame).toHaveBeenCalledWith("Jimbob", "fake-ticket");
                });

                describe('when we are assigned a game', function() {

                    it('switches to the game view for the game', function() {

                        svc.createGameService.and.returnValue("fake-game-service");

                        model.name("Joe");
                        model.queue();
                        queueDefer.resolve({ ticket: "joe-ticket" });
                        gameDefer.resolve({ link: "game-link" });

                        var expectedKeys = {
                            service: "fake-game-service",
                            ticket: "joe-ticket",
                            name: "Joe"
                        };

                        expect(svc.createGameService).toHaveBeenCalledWith("game-link");
                        expect(manager.setComponent).toHaveBeenCalledWith(
                            "gameView",
                            expectedKeys);
                    });
                });

                describe('when we fail to get a game', function() {
                    beforeEach(function() {
                        svc.createGameService.and.returnValue("fake-game-service");

                        model.name("Joe");
                        model.queue();
                        queueDefer.resolve({ ticket: "joe-ticket" });
                        gameDefer.reject();
                    });

                    it('re-enables the queue button', function() {
                        expect(model.queueButtonEnabled()).toEqual(true);
                    });

                    it('allows editing the player name', function() {
                        expect(model.canEditPlayerName()).toEqual(true);
                    });
                });
            });

            describe('when we fail to join the queue', function() {

                beforeEach(function() {
                    queueDefer.reject();
                    model.queue();
                });

                it('re-enables the queue button', function() {
                    expect(model.queueButtonEnabled()).toEqual(true);
                });

                it('allows editing the player name', function() {
                    expect(model.canEditPlayerName()).toEqual(true);
                });
            });
        });
    });
});
