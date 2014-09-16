"use strict";

var gulp = require('gulp'),
	jshint = require('gulp-jshint'),
    browserify = require('browserify'),
    source = require('vinyl-source-stream'),
    rimraf = require('rimraf'),
    react = require('gulp-react'),
    s3 = require('gulp-s3'),
    request = require('request'),
    gutil = require('gulp-util');

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
		// Need the trailing slash, otherwise the SHA is prepended to the filename.
		uploadPath: process.env.COMMIT_SHA + '/'
	};
	return gulp.src('./dist/**')
		.pipe(s3(aws, options));
});

gulp.task('update-github', function(cb) {
	var githubUrl = 'https://api.github.com/repos/'
				+ process.env.TRAVIS_REPO_SLUG
				+ '/commits/'
				+ process.env.COMMIT_SHA
				+ '/comments';

	var deploymentUrl =	'https://s3.amazonaws.com/simpleumdapp-gaudi/'
				+ process.env.COMMIT_SHA
				+ '/Host.html';

	var options = {
		url: githubUrl,
		headers: {
			'Authorization': 'token ' + process.env.GITHUB_TOKEN,
			'User-Agent': 'cpacey'
		},
		json: {
			'body': '[Deployment available online](' + deploymentUrl + ')'
		}
	};

	request.post(options, function(error, response, body) {
		if (error) {
			gutil.log(gutil.colors.red('[FAILED]', error));
		} else if ( response.statusCode != 201 ) {
			gutil.log(gutil.colors.red(
				'[FAILED]',
				response.statusCode,
				JSON.stringify(body)
			));
		}
		cb();
	});
});
