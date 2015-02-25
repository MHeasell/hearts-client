require.baseUrl = '../';

require.paths['jasmine'] = "bower_components/jasmine/lib/jasmine-core/jasmine";
require.paths['jasmine-html'] = "bower_components/jasmine/lib/jasmine-core/jasmine-html";
require.paths['jasmine-boot'] = "bower_components/jasmine/lib/jasmine-core/boot";

require.shim['jasmine'] = { exports: 'window.jasmineRequire' };
require.shim['jasmine-html'] = { deps: ['jasmine'], exports: 'window.jasmineRequire' };
require.shim['jasmine-boot'] = { deps: ['jasmine', 'jasmine-html'], exports: 'window.jasmineRequire' };
