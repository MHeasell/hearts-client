var gulp = require('gulp');
var rjs = require('gulp-requirejs');
var replace = require('gulp-replace');
var es = require('event-stream');
var htmlreplace = require('gulp-html-replace');
var concat = require('gulp-concat');
var clean = require('gulp-clean');

var rjsOptimizerConfig = {
    mainConfigFile: 'require.config.js',
    out: 'scripts.js',
    baseUrl: '.',
    name: "hearts",
    paths: {
        requireLib: 'bower_components/requirejs/require'
    },
    include: [
        'requireLib',
        'components/queueView/queueView',
        'components/gameView/gameView'
    ]
};

gulp.task('js', function() {
    return rjs(rjsOptimizerConfig).pipe(gulp.dest('./dist/'));
});

gulp.task('html', function() {
    return gulp.src("index.html")
        .pipe(htmlreplace({
            'js': 'scripts.js',
            'css': 'css.css'
        }))
        .pipe(gulp.dest("./dist/"));
});

gulp.task('css', function() {

    var bootstrapStream = gulp.src('bower_components/bootstrap/dist/css/bootstrap.min.css')
        .pipe(replace(/url\((['"])?\.\.\/fonts\//g, "url($1fonts/"));

    var cssFiles = [
        'bower_components/bootstrap/dist/css/bootstrap-theme.min.css',
        'cards.css',
        'style.css'
    ];

    var cssStream = gulp.src(cssFiles);
    var combinedCssStream = es.concat(bootstrapStream, cssStream)
        .pipe(concat('css.css'));

    var fontStream = gulp.src('bower_components/bootstrap/dist/fonts/*', { base: 'bower_components/bootstrap/dist/' });

    var cardStream = gulp.src('cards/*', { base: '.' });

    return es.concat(combinedCssStream, fontStream, cardStream)
        .pipe(gulp.dest("./dist/"));
});

gulp.task('default', ['js', 'css', 'html'], function() {

});

gulp.task('clean', function() {
    return gulp.src('./dist/**/*', { read: false })
        .pipe(clean());
});
