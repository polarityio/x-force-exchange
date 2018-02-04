let async = require('async');
let request = require('request');
let config = require('./config/config');

let Logger;

function getRequestOptions(options) {
    return {
        auth: {
            user: options.apikey,
            password: options.password
        },
        json: true
    };
}

function doLookup(entities, options, callback) {
    Logger.trace({ entities: entities }, 'Entities received');

    let results = [];

    async.each(entities, (entity, done) => {
        let requestOptions = getRequestOptions(options);
        requestOptions.url = options.host + '/ipr/' + entity.value;

        Logger.trace({ entity: entity }, 'Looking up entity in x-force exchange');

        request(requestOptions, function (err, resp, body) {
            Logger.trace({ error: err, response: resp, body: body }, 'Results of lookup');

            if (err) {
                done(err);
                return;
            }

            results.push({
                entity: entity,
                data: {
                    summary: ['test'],
                    details: body
                }
            });
            done();
        });
    }, (err) => {
        Logger.trace({ results: results }, 'All entity lookups completed, returning results to client');
        callback(err, results);
    });
}

function startup(logger) {
    Logger = logger;
}

function validateOption(errors, options, optionName, errMessage) {
    if (typeof options[optionName].value !== 'string' ||
        (typeof options[optionName].value === 'string' && options[optionName].value.length === 0)) {
        errors.push({
            key: optionName,
            message: errMessage
        });
    }
}

function validateOptions(options, callback) {
    let errors = [];

    validateOption(errors, options, 'host', 'You must provide a valid host for the IBM X-Force Exchange server.');
    validateOption(errors, options, 'apikey', 'You must provide a valid apikey for authentication with the IBM X-Force Exchange server.');
    validateOption(errors, options, 'password', 'You must provide a valid password for authentication with the IBM X-Force Exchange server.');

    callback(null, errors);
}

module.exports = {
    doLookup: doLookup,
    startup: startup,
    validateOptions: validateOptions
};
