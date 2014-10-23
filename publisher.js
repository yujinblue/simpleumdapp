var vfs = require('vinyl-fs');
var pg = require('peanut-gallery');
var pjson = require('./package.json');

// for gLog (gutil)
var colors = require('chalk');
var date = require('dateformat');

// for s3 (gulp-s3)
var knox = require('knox');
var es = require('event-stream');
var mime = require('mime');

module.exports = function( aws, options, cb ) {

	vfs.src('./dist/**')
		.pipe( s3( aws, options ) )
		.on( 'end', function() {

			
			var linkUrl = 'https://s3.amazonaws.com/apporacle-ui-dev/Version.html?'
				+ 'key=' + pjson.name
				+ '&version=' + getDevVersion();
			var message = '[View on AppOracle](' + linkUrl + ')';

			pg.comment( message, {}, function( error, response ) {
				if( error )
					gLog( colors.red( '[FAILED]', JSON.stringify( error ) ) );
				cb();
			} );

		});

}

function getDevVersion() {
	return pjson.version + '-' + process.env.COMMIT_SHA;
}

function gLog(){
  var time = '['+colors.grey(date(new Date(), 'HH:MM:ss'))+']';
  var args = Array.prototype.slice.call(arguments);
  args.unshift(time);
  console.log.apply(console, args);
  return this;
};



function s3(aws, options) {
  options = options || {};

  if (!options.delay) { options.delay = 0; }

  var client = knox.createClient(aws);
  var waitTime = 0;
  var regexGzip = /\.([a-z]{2,})\.gz$/i;
  var regexGeneral = /\.([a-z]{2,})$/i;

  return es.mapSync(function (file) {

      // Verify this is a file
      if (!file.isBuffer()) { return file; }

      var uploadPath = file.path.replace(file.base, options.uploadPath || '');
      uploadPath = uploadPath.replace(new RegExp('\\\\', 'g'), '/');
      var headers = { 'x-amz-acl': 'public-read' };
      if (options.headers) {
          for (var key in options.headers) {
              headers[key] = options.headers[key];
          }
      }

      if (regexGzip.test(file.path)) {
          // Set proper encoding for gzipped files, remove .gz suffix
          headers['Content-Encoding'] = 'gzip';
          uploadPath = uploadPath.substring(0, uploadPath.length - 3);
      } else if (options.gzippedOnly) {
          // Ignore non-gzipped files
          return file;
      }

      // Set content type based of file extension
      if (!headers['Content-Type'] && regexGeneral.test(uploadPath)) {
        headers['Content-Type'] = mime.lookup(uploadPath);
        if (options.encoding) {
          headers['Content-Type'] += '; charset=' + options.encoding;
        }
      }

      headers['Content-Length'] = file.stat.size;

      client.putBuffer(file.contents, uploadPath, headers, function(err, res) {
        if (err || res.statusCode !== 200) {
          gLog(colors.red('[FAILED]', file.path + " -> " + uploadPath));
        } else {
          gLog(colors.green('[SUCCESS]', file.path + " -> " + uploadPath));
          res.resume();
        }
      });

      return file;
  });
};