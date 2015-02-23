require.config({
    baseUrl: '../',
    paths: {
        jquery: "bower_components/jquery/dist/jquery.min",
        knockout: "bower_components/knockout/dist/knockout",
        bootstrap: "bower_components/bootstrap/dist/js/bootstrap.min",
        text: "bower_components/requirejs-text/text",

        jasmine: "bower_components/jasmine/lib/jasmine-core/jasmine",
        'jasmine-html': "bower_components/jasmine/lib/jasmine-core/jasmine-html",
        'jasmine-boot': "bower_components/jasmine/lib/jasmine-core/boot"
    },
    shim: {
        bootstrap: { deps: ["jquery"] },

        jasmine: { exports: 'window.jasmineRequire' },
        'jasmine-html': { deps: ['jasmine'], exports: 'window.jasmineRequire' },
        'jasmine-boot': { deps: ['jasmine', 'jasmine-html'], exports: 'window.jasmineRequire' }
    }
});

(function() {
    var testModules = [
        'components/queueView',
        'components/gameView'
    ];

    require(['jasmine-boot'], function() {
        var modulesCorrectedPaths = testModules.map(
            function(m) { return 'test/' + m; });

        require(modulesCorrectedPaths, window.onload);
    });
})();