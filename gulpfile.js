"use strict";

var gulp = require('gulp'),
	jshint = require('gulp-jshint'),
    browserify = require('browserify'),
    source = require('vinyl-source-stream'),
    rimraf = require('rimraf'),
    react = require('gulp-react'),
    s3 = require('gulp-s3');

gulp.task('clean', function(cb){
    rimraf('dist', cb);
});

gulp.task('browserify', ['jshint'], function () {
	var bundler = new browserify({ standalone: 'app.jsx' });
	bundler.add('./src/app.jsx');
	return bundler
		.bundle()
		.pipe(source('app.js'))
        .pipe(gulp.dest('dist'));
});

gulp.task('jshint', function () {
	return gulp.src(['./src/**/*.js', './src/**/*.jsx'])
		.pipe(react())
		.pipe(jshint('.jshintrc'))
		.pipe(jshint.reporter('default'));
});

gulp.task('host-html', function() {
	return gulp.src('Host.html')
		.pipe(gulp.dest('dist'));
});

gulp.task('test');

gulp.task('build', ['clean'], function() {
	gulp.start('browserify', 'host-html');
});

gulp.task('default', ['build', 'test']);

gulp.task('publish-s3', function() {
	var aws = {
		"key": "AKIAJ5PPAPSA2QQHPAYA",
		"secret": process.env.S3_SECRET,
		"bucket": "simpleumdapp-gaudi"
	};
	var options = {
		uploadPath: process.env.COMMIT_SHA
	};
	return gulp.src('./dist/**')
		.pipe(s3(aws, options));
});