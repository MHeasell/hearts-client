require.config({
    baseUrl: '../',
    paths: {
        jquery: "bower_components/jquery/dist/jquery.min",
        knockout: "bower_components/knockout/dist/knockout",
        bootstrap: "bower_components/bootstrap/dist/js/bootstrap.min",
        text: "bower_components/requirejs-text/text"
    },
    shim: {
        bootstrap: { deps: ["jquery"] }
    }
});

(function() {
    var testModules = [
        'components/queueView',
        'components/gameView'
    ];

    var modulesCorrectedPaths = testModules.map(
        function(m) { return 'test/' + m; });

    require(modulesCorrectedPaths, window.onload);
})();