var vinyl = require('vinyl-fs'),
  s3 = require('gulp-s3');

module.exports = function(appId, version, dist, filelist) {

  var aws = {
    "key": "AKIAJJTADL5PBDDLOQGA",
    "secret": "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",
    "bucket": "gaudi-cdn-test"
  };

  var options = {
    // Need the trailing slash, otherwise the SHA is prepended to the filename.
    uploadPath: "apps/simpleumdapp/" + appId + "/" + version + "/go/"
  };

  for (var i = 0; i < filelist.length; i++) {
    filelist[i] = dist + filelist[i];
  };  

  return vinyl.src(filelist)
        .pipe( s3(aws, options));
  
}