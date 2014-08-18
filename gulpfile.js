var browserify = require("gulp-browserify")
var concat = require('gulp-concat')
var plumber = require('gulp-plumber')
var gulp = require('gulp')

gulp.task("browserify", function(  ){
  gulp.src(["src/index.js"])
    .pipe(plumber())
    .pipe(browserify({}))
    .pipe(concat("hud.js"))
    .pipe(gulp.dest(process.cwd()))
})

gulp.task("default", ["browserify"])

gulp.watch("src/**/*.js", ["browserify"])
