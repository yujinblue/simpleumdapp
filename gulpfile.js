"use strict";

var gulp = require('gulp'),
	jshint = require('gulp-jshint'),
    browserify = require('browserify'),
    source = require('vinyl-source-stream'),
    rimraf = require('rimraf'),
    react = require('gulp-react'),
    s3 = require('gulp-s3'),
    request = require('request'),
    gutil = require('gulp-util'),
    streamifier = require('streamifier'),
    pjson = require('./package.json');

var defaultTarget = 'https://s3.amazonaws.com/simpleumdapp-gaudi/'
	+ process.env.COMMIT_SHA;

gulp.task('clean', function(cb){
    rimraf('dist', cb);
});

gulp.task('browserify', ['jshint'], function () {
	var bundler = new browserify({ standalone: 'app.jsx' });
	bundler.external( 'd2l-orgunit' );
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

gulp.task( 'appconfig', function( cb ) {

	var argv = require('yargs')
		.default( 'target', defaultTarget )
		.argv;

	var appconfig = {
		"schema": "http://apps.d2l.com/uiapps/config/v1.json",
		"metadata": {
			"name": pjson.name,
			"version": pjson.version,
			"key": pjson.name,
			"description": pjson.description
		},
		"loader": {
			"schema": "http://apps.d2l.com/uiapps/umdschema/v1.json",
			"endpoint": argv.target + "/app.js"
		}
	};

	return streamifier
		.createReadStream( JSON.stringify( appconfig, null, '\t' ) )
		.pipe( source( 'appconfig.json' ) )
		.pipe( gulp.dest( 'dist' ) );

} );

gulp.task('build', ['browserify', 'appconfig']);

gulp.task('default', ['build']);

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

var configUrl = defaultTarget + '/appconfig.json';

var devVersion = pjson.version + '-' + process.env.COMMIT_SHA;

gulp.task('update-github', function(cb) {
	var githubUrl = 'https://api.github.com/repos/'
				+ process.env.TRAVIS_REPO_SLUG
				+ '/commits/'
				+ process.env.COMMIT_SHA
				+ '/comments';

	var linkUrl = 'https://s3.amazonaws.com/apporacle-ui-dev/Version.html?'
		+ 'key=' + pjson.name
		+ 'version=' + devVersion;

	var options = {
		url: githubUrl,
		headers: {
			'Authorization': 'token ' + process.env.GITHUB_TOKEN,
			'User-Agent': 'cpacey'
		},
		json: {
			'body': '[View on AppOracle](' + linkUrl + ')'
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

gulp.task('update-apporacle', function(cb) {
	var options = {
		url: 'http://apporacle-dev.elasticbeanstalk.com/apps/' + pjson.name,
		json: {
			'url': configUrl,
			'version': devVersion
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