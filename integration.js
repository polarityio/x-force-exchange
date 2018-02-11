let async = require('async');
let request = require('request');
let config = require('./config/config');

let Logger;
let requestOptions = {
    json: true
};

function getRequestOptions(options) {
    let opts = JSON.parse(JSON.stringify(requestOptions));
    opts.auth = {};
    opts.auth.user = options.apikey;
    opts.auth.password = options.password;

    return opts;
}

function doLookup(entities, options, callback) {
    Logger.trace({ entities: entities, options: options }, 'Entities received');

    let results = [];
    let minimumScore = options.minimumScore;

    Logger.trace({ minimumScore: minimumScore });

    async.each(entities, (entity, done) => {
        let requestOptions = getRequestOptions(options);

        if (entity.isIP) {
            requestOptions.url = options.host + '/ipr/' + entity.value;
            Logger.trace({ entity: entity }, 'Looking up entity in x-force exchange');

            request(requestOptions, function (err, resp, body) {
                Logger.trace({ error: err, response: resp, body: body }, 'Results of lookup');

                if (err) {
                    done(err);
                    return;
                }

                Logger.trace({ minimumScore: minimumScore, resultScore: body.score, comparison: body.score < minimumScore });

                if (body.score < minimumScore) {
                    done();
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
        } else if (entity.isURL || entity.isDomain) {
            requestOptions.url = options.host + '/url/' + entity.value;
            Logger.trace({ entity: entity }, 'Looking up entity in x-force exchange');

            request(requestOptions, function (err, resp, body) {
                Logger.trace({ error: err, response: resp, body: body }, 'Results of lookup');

                if (err) {
                    done(err);
                    return;
                }

                if (!body || !body.result) {
                    done();
                    return;
                }

                Logger.trace({ minimumScore: minimumScore, resultScore: body.result.score, comparison: body.result.score < minimumScore });

                if (body.result.score < minimumScore) {
                    done();
                    return;
                }

                let detail = body.result;
                detail.tags = body.tags;

                results.push({
                    entity: entity,
                    data: {
                        summary: ['test'],
                        details: detail
                    }
                });

                done();
            });
        } else {
            done();
        }
    }, (err) => {
        Logger.trace({ results: results }, 'All entity lookups completed, returning results to client');
        callback(err, results);
    });
}

function startup(logger) {
    Logger = logger;

    if (typeof config.request.cert === 'string' && config.request.cert.length > 0) {
        requestOptions.cert = fs.readFileSync(config.request.cert);
    }

    if (typeof config.request.key === 'string' && config.request.key.length > 0) {
        requestOptions.key = fs.readFileSync(config.request.key);
    }

    if (typeof config.request.passphrase === 'string' && config.request.passphrase.length > 0) {
        requestOptions.passphrase = config.request.passphrase;
    }

    if (typeof config.request.ca === 'string' && config.request.ca.length > 0) {
        requestOptions.ca = fs.readFileSync(config.request.ca);
    }

    if (typeof config.request.proxy === 'string' && config.request.proxy.length > 0) {
        requestOptions.proxy = config.request.proxy;
    }

    if (typeof config.request.rejectUnauthorized === 'boolean') {
        requestOptions.rejectUnauthorized = config.request.rejectUnauthorized;
    }
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

    let minimumScore = Number(options.minimumScore.value);
    if (options.minimumScore.value.length === 0 || !Number.isInteger(minimumScore)) {
        errors.push({
            key: 'minimumScore',
            message: 'You must provide a valid, numeric, minimum score for Polarity to display.'
        })
    }

    callback(null, errors);
}

module.exports = {
    doLookup: doLookup,
    startup: startup,
    validateOptions: validateOptions
};
