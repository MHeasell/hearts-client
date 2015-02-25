var require = {
    paths: {
        jquery: "bower_components/jquery/dist/jquery.min",
        knockout: "bower_components/knockout/dist/knockout",
        bootstrap: "bower_components/bootstrap/dist/js/bootstrap.min",
        text: "bower_components/requirejs-text/text"
    },
    shim: {
        bootstrap: { deps: ["jquery"] }
    }
};
