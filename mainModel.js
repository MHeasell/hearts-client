define(['knockout'], function(ko) {

    function MainModel() {

        this.componentInfo = ko.observable();

        this.setComponent = function(name, params) {
            params.manager = this;
            this.componentInfo({name: name, params: params});
        };
    }

    return MainModel;
});