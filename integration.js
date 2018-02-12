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

function transformResult(entity, body) {
    let details = {
        titledProperties: [], // {key: 0, value: 1}
        headerLists: [], // {key: 0, value: 1}
        tags: [] // list of strings
    };

    Logger.trace({ ip: entity.value }, 'Transforming entity');

    details.titledProperties.push({
        key: 'Score',
        value: body.score
    });

    if (entity.isIP) {

        details.titledProperties.push({
            key: 'Reason: ',
            value: body.reason
        });

        if (body.geo) {
            if (body.geo.country && body.geo.countrycode) {
                details.titledProperties.push({
                    key: 'Country',
                    value: body.geo.country + ' - ' + body.geo.countrycode
                });
            } else if (body.geo.country) {
                details.titledProperties.push({
                    key: 'Country',
                    value: body.geo.country
                });
            } else if (body.geo.countrycode) {
                details.titledProperties.push({
                    key: 'Country',
                    value: body.geo.countrycode
                });
            }
        }

        if (body.cats && Object.keys(body.cats) > 0) {
            let list = {
                header: 'Categories',
                items: []
            };

            for (k in body.cats) {
                list.items.push({
                    key: k,
                    value: body.cats[k]
                });
            }

            details.headerLists.push(list);
        }

        details.raw = body;
        details.link = 'https://exchange.xforce.ibmcloud.com/ip/' + entity.value;
    } else if (entity.isDomain || entity.isURL) {


        details.headerLists.push({

        })

        for (k in body.cats) {
            details.tags.push(k);
        }

        details.raw = body.result;
        details.link = 'https://exchange.xforce.ibmcloud.com/url/' + entity.value;

    } else if (entity.isHash) {
        details.link = 'https://exchange.xforce.ibmcloud.com/malware/' + entity.value;
    } else {
        throw new Error('if this error occures it means you added data ' +
            'types in config.js without updating the code in integration.js');
    }

    Logger.trace({ details: details }, 'Transformed details');


    return details;
}

function doLookup(entities, options, callback) {
    Logger.trace({ entities: entities, options: options }, 'Entities received');

    let results = [];
    let minimumScore = options.minimumScore;

    Logger.trace({ minimumScore: minimumScore });

    async.each(entities, (entity, done) => {
        Logger.trace({ entity: entity }, 'Looking up entity in x-force exchange');
        let requestOptions = getRequestOptions(options);

        if (entity.isIP) {
            requestOptions.url = options.host + '/ipr/' + entity.value;
        } else if (entity.isURL || entity.isDomain) {
            requestOptions.url = options.host + '/url/' + entity.value;
        } else if (entity.isHash) {
            requestOptions.url = options.host + '/malware/' + entity.value;
        } else {
            done();
            return;
        }

        request(requestOptions, function (err, resp, body) {
            Logger.trace({ error: err, body: body }, 'Results of lookup');

            if (err) {
                done(err);
                return;
            }

            if (!body) {
                done();
                return;
            }

            if (body.score < minimumScore) {
                done();
                return;
            }

            let result = {
                entity: entity,
                data: {
                    summary: ['test'],
                    details: transformResult(entity, body)
                }
            };

            Logger.trace({ result: result }, 'Result added to list');

            results.push(result);

            done();
        });
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
