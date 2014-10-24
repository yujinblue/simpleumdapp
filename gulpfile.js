"use strict";

var gulp = require('gulp'),
	jshint = require('gulp-jshint'),
    browserify = require('browserify'),
    source = require('vinyl-source-stream'),
    rimraf = require('rimraf'),
    react = require('gulp-react'),
    s3 = require('gulp-s3'),
	pg = require('peanut-gallery'),
    request = require('request'),
    gutil = require('gulp-util'),
    watchify = require('watchify'),
    frau = require('free-range-app-utils'),
    localAppResolver = frau.localAppResolver(),
    publisher = require('./publisher');

var defaultTarget = 'https://s3.amazonaws.com/simpleumdapp-gaudi/'
	+ process.env.COMMIT_SHA;

var argv = require('yargs').default( 'target', defaultTarget ).argv;

gulp.task('clean', function(cb){
    rimraf('dist', cb);
});

function getBundler() {
	var bundler = new browserify({ standalone: 'app.jsx' });
	bundler.external( 'd2l-orgunit' );
	bundler.add('./src/app.jsx');
	return bundler;
}

function bundle(bundler) {
	return bundler.bundle()
		.pipe(source('app.js'))
        .pipe(gulp.dest('dist'));
};

gulp.task('browserify', ['jshint'], function () {
	return bundle(getBundler());
});

gulp.task('jshint', function () {
	return gulp.src(['./src/**/*.js', './src/**/*.jsx'])
		.pipe(react())
		.pipe(jshint('.jshintrc'))
		.pipe(jshint.reporter('default'));
});

function makeAppConfig(target) {
	return frau.appConfigBuilder.buildStream(target)
		.pipe( gulp.dest( 'dist' ) );
}

gulp.task( 'appconfig-s3', function() {
	return makeAppConfig(argv.target);
});

gulp.task( 'appconfig-local', function() {
	return makeAppConfig(localAppResolver.getUrl());
});

gulp.task('browserify-watch', function(){
	var bundler = watchify(getBundler());
	bundler.on('update', function() {
		gulp.start('browserify-watch');
	});
	return bundle(bundler);
});

gulp.task('local', ['browserify-watch', 'appconfig-local'], function() {
	gulp.watch('package.json', ['appconfig-local']);
	localAppResolver.host();
});

gulp.task('build', ['browserify', 'appconfig-s3']);

gulp.task('publish-s3', function( cb ) {
	var pjson = require('./package.json');
	var dist = './dist/';
	var filelist = ['pooh.json', 'piglet.json'];
	publisher(pjson.name, pjson.version, dist, filelist)
		.on( 'end', function() {

			var pjson = require('./package.json');
			var linkUrl = 'https://s3.amazonaws.com/apporacle-ui-dev/Version.html?'
				+ 'key=' + pjson.name
				+ '&version=' + getDevVersion();
			var message = '[View on AppOracle](' + linkUrl + ')';

			pg.comment( message, {}, function( error, response ) {
				if( error )
					gutil.log( gutil.colors.yellow( 'PEANUT[FAILED]', JSON.stringify( error ) ) );
				cb();
			} );

		} );
});

function getDevVersion() {
	var pjson = require('./package.json');
	return pjson.version + '-' + process.env.COMMIT_SHA;
}

gulp.task('update-apporacle', function(cb) {
	var pjson = require('./package.json');

	var options = {
		url: 'http://apporacle-dev.elasticbeanstalk.com/apps/' + pjson.name,
		json: {
			'url': defaultTarget + '/appconfig.json',
			'version': getDevVersion()
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
