"use strict";

var gulp = require('gulp'),
	jshint = require('gulp-jshint'),
    browserify = require('browserify'),
    source = require('vinyl-source-stream');

gulp.task('browserify', ['jshint'], function () {
	var bundler = new browserify({ standalone: 'app.js' });
	bundler.add('./src/app.js');
	return bundler
		.bundle()
		.pipe(source('app.js'))
        .pipe(gulp.dest('dist'));
});

gulp.task('jshint', function () {
	return gulp.src('./src/**/*.js ')
		.pipe(jshint('.jshintrc'))
		.pipe(jshint.reporter('default'));
});

gulp.task('default', ['browserify']);