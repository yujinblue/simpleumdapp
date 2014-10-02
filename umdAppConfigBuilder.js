'use strict';

var streamifier = require('streamifier');
var source = require('vinyl-source-stream');

function build(target, opts) {
    if ( !target ) {
        throw new Error('missing target');
    }

    var pjson = JSON.parse(require('fs').readFileSync('package.json'));

    opts = opts || {};
    opts.name = opts.name || pjson.name;
    opts.version = opts.version || pjson.version;
    opts.id = opts.id || pjson.name;
    opts.description = opts.name || pjson.description;

    var appConfig = {
        "schema": "http://apps.d2l.com/uiapps/config/v1.json",
        "metadata": {
            "name": pjson.name,
            "version": pjson.version,
            "key": pjson.name,
            "description": pjson.description
        },
        "loader": {
            "schema": "http://apps.d2l.com/uiapps/umdschema/v1.json",
            "endpoint": target + "/app.js"
        }
    };

    return appConfig;
}

function buildStream(target, opts) {
    var appConfig = build(target, opts);
    return streamifier
        .createReadStream( JSON.stringify( appConfig, null, '\t' ) )
        .pipe( source('appconfig.json') );
}

module.exports = {
    build: build,
    buildStream: buildStream
};
