(function() {
    var testModules = [
        'heartsUtil',
        'components/queueView',
        'components/gameView'
    ];

    require(['jasmine-boot'], function() {
        var modulesCorrectedPaths = testModules.map(
            function(m) { return 'test/' + m; });

        require(modulesCorrectedPaths, window.onload);
    });
})();