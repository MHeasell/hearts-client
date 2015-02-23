define(['components/gameView/gameView'], function(gameView) {
    var Model = gameView.viewModel;

    describe('View Model', function() {
        it('should do arithmetic', function() {
            expect(1 + 1).toEqual(2);
        });
    });
});
