/* eslint-env node */
// 1. LIBRARIES
// - - - - - - - - - - - - - - -

var gulp = require('gulp');
var del = require('del');
var sass = require('gulp-sass');
var browserSync = require('browser-sync').create();
var htmlmin = require('gulp-htmlmin');
var eslint = require('gulp-eslint');
var gulpif = require('gulp-if');
var useref = require('gulp-useref');
var runSequence = require('run-sequence');
var concat = require('gulp-concat');
// var purifycss = require('gulp-purifycss');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var cssnano = require('gulp-cssnano');
var size = require('gulp-size');
var sourcemaps = require('gulp-sourcemaps');
var autoprefixer = require('gulp-autoprefixer');
var imagemin = require('gulp-imagemin');
var argv = require('yargs').argv;
var cache = require('gulp-cache');

// 2. CONFIGURATION
// - - - - - - - - - - - - - - -

// Check for --production flag
const PRODUCTION = !!(argv.production);

const PATHS = {

    dist: "dist",

    pub: "public/**/*",

    html: {
        src: "src/**/*.html",
        dest: "dist"
    },

    css: {
        src: "src/scss/*.scss",
        watch: "src/scss/**/*.scss",
        dest: "dist/assets/css",
    },

    js: {
        src: "src/js/**/*.js",
        dest: "dist/assets/js",
    },

    images: {
        src: "src/assets/img/**/*.+(png|jpg|jpeg|gif|svg)",
        dest: "dist/assets/img"
    },

    assets: [ // paths to static assets, except images
        "src/assets/**/*",
        "!src/assets/img"
    ],

    sass: [ // sass will check these folders for files when you use @import.

    ],

    scripts: [ // list all needed scripts here in the right order to be correctly concatenated
        "node_modules/jquery/dist/jquery.js",
        "src/js/main.js"
    ]
}

// css compatibility for autoprefixer
// consider moving to package.json as a browserslist key (https://github.com/ai/browserslist)
const COMPATIBILITY = [
    'ie >= 10',
    'ie_mob >= 10',
    'ff >= 30',
    'chrome >= 34',
    'safari >= 7',
    'opera >= 23',
    'ios >= 7',
    'android >= 4.4',
    'bb >= 10'
];

// 3. TASKS
// - - - - - - - - - - - - - - -

// Process HTML files
gulp.task('html', function() {
    return gulp.src(PATHS.html.src)
        .pipe(gulpif(PRODUCTION, useref({
            noAssets:true
        })))
        .pipe(gulpif(PRODUCTION, htmlmin({
            removeComments: true,
            collapseWhitespace: true,
            conservativeCollapse: true,
            preserveLineBreaks: true
        })))
        .pipe(gulp.dest(PATHS.html.dest));
});


// Process Scripts
gulp.task('scripts', function() {

    return gulp.src(PATHS.scripts)
        .pipe(sourcemaps.init())
        .pipe(concat(PRODUCTION ? "bundle.min.js" : "bundle.js"))
        .pipe(gulpif(PRODUCTION, uglify().on('error', function(e) {
            console.log(e);
        })))
        .pipe(sourcemaps.write('.'))
        .pipe(size({title: 'Minifying concatenated script bundle...', showFiles: true}))
        .pipe(gulp.dest(PATHS.js.dest));
});


// Compile SASS into CSS & auto-inject into browsers
gulp.task('sass', function() {
    return gulp.src(PATHS.css.src) // dont include partials directory

        .pipe(sourcemaps.init())

        .pipe(sass({
            includePaths: PATHS.sass,
            errLogToConsole: true
        }))
        .pipe(autoprefixer({
            browsers: COMPATIBILITY,
            cascade: false
        }))

        // UNCOMMENT THE PIPE BELOW TO USE PURIFYCSS IN PRODUCTION
        // PurifyCSS relies on html and javascript to have been already processed so that it can analyse them for css selector usage
        //.pipe(gulpif(PRODUCTION, purifycss([(PATHS.html.dest + "/**/*.html"), (PATHS.js.dest + "/*.js")],{minify: false, info: true})))
        // debatable whether purifycss is necessary
        // because framework SCSS libraries such as Foundation/Bootstrap are modular

        .pipe(gulpif(PRODUCTION, cssnano({
            safe:true
        })))

        .pipe(gulpif(PRODUCTION, rename({suffix: '.min'})))

        .pipe(sourcemaps.write('.'))

        .pipe(gulp.dest(PATHS.css.dest))

        .pipe(gulpif(browserSync.active, browserSync.stream()));

});

// optimize images
gulp.task('images', function() {

    // Caching images that ran through imagemin
    var imgmin = cache(imagemin(
        [
            imagemin.gifsicle({interlaced: true}),
            imagemin.jpegtran({progressive: true}),
            imagemin.optipng({optimizationLevel: 5}),
            imagemin.svgo({
                plugins: [
                    {removeViewBox: true},
                    {cleanupIDs: false}
                ]

            })
        ],
        {
            verbose: true
        }
    ));

    return gulp.src(PATHS.images.src)
        .pipe(gulpif(PRODUCTION, imgmin))
        .pipe(gulpif(PRODUCTION, size({title: "Compressing images..."})))
        .pipe(gulp.dest(PATHS.images.dest));
});

// Lint javascript
gulp.task('lint', function () {
    return gulp.src(PATHS.js.src)
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(gulpif(!browserSync.active, eslint.failAfterError()));
    //.pipe(eslint.failAfterError());
});

// Clean output directories
gulp.task('clean', function() {
    cache.clearAll();
    // delete everything inside dist but not dist itself
    return del([(PATHS.dist + '/**'), ('!'+ PATHS.dist)], {dot: false});
});

// Copy assets (images/fonts etc.)
gulp.task('copy', function(done) {

    // if production copy contents of public folder over aswell
    gulp.src(PATHS.assets).pipe(gulp.dest((PATHS.dist + "/assets")));
    gulp.src(PATHS.pub).pipe(gulpif(PRODUCTION, gulp.dest(PATHS.dist)));
    done();

});

// Build files
gulp.task('build', [], function(done) {
    runSequence('clean', 'lint', ['html', 'scripts'], 'sass', ['images', 'copy'], done);
});

// Default task: build development files and start a server
gulp.task('default', ['build'], function() {

    // start static server  and watch scss/html/js files
    browserSync.init({
        server: {
            baseDir : ['./dist']
        },
        browser: ['firefox'],
        files: "./dist/**/*"
    });

    gulp.watch(PATHS.html.src, ['html']);
    gulp.watch(PATHS.js.src, ['scripts']);
    gulp.watch(PATHS.css.watch, ['sass']);
    gulp.watch(PATHS.images.src, ['images']);

});




/*
// Watch functions
// create a task that ensures the 'html' task is complete before reloading browsers
gulp.task('html-watch', ['html'], function (done) {
    browserSync.reload();
    done();
});

// create a task that ensures the 'scripts' task is complete before reloading browsers
gulp.task('js-watch', ['scripts'], function (done) {
    browserSync.reload();
    done();
});

// Build task: build files for production and serve
gulp.task('build', ['build:prod'], function() {
    // start server
    browserSync.init({
        server: {
            baseDir : [PATHS.deploy]
        },
        browser: ["chrome"]
    });


});

*/
