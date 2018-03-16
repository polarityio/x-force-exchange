let async = require('async');
let request = require('request');
let config = require('./config/config');
let Transformer = require('./transformer');

let transformer;
let Logger;
let requestWithDefaults;


const risk = {
    'high': 3,
    'medium': 2,
    'low': 1,
    '': 0
};

const DATA_TYPE_ERROR = 'if this error occurs it means you added data ' +
    'types in config.js without updating the code in integration.js';

function doLookup(entities, options, callback) {
    Logger.trace({ entities: entities, options: options }, 'Entities received');

    let results = [];
    let minimumScore = options.minimumScore;
    let minimumRisk = options.minimumRisk;

    Logger.trace({ minimumScore: minimumScore, minimumRisk: minimumRisk });

    async.each(entities, (entity, done) => {
        Logger.trace({ entity: entity }, 'Looking up entity in x-force exchange');

        // x-force only seems to like URLs that start with http or https
        if(entity.isURL && !_isValidUrl(entity.value)){
            done(null);
            return;
        }

        let requestOptions = {
            auth:{
                user: options.apikey,
                password: options.password
            }
        };

        if (entity.isIP) {
            requestOptions.url = options.host + '/ipr/' + entity.value;
        } else if (entity.isURL || entity.isDomain) {
            requestOptions.url = options.host + '/url/' + entity.value;
        } else if (entity.isHash) {
            requestOptions.url = options.host + '/malware/' + entity.value;
        } else {
            Logger.error({ entity: entity }, DATA_TYPE_ERROR);
            throw new Error(DATA_TYPE_ERROR);
        }

        requestWithDefaults(requestOptions, function (err, resp, body) {
            Logger.trace({ error: err, body: body }, 'Results of lookup');

            if (err) {
                done(err);
                return;
            }

            if (resp.statusCode !== 200) {
                if (resp.statusCode === 404) {
                    Logger.trace({ id: entity.value }, 'Entity not in x-force exhange');
                    results.push({
                        entity: entity,
                        data: null
                    });
                    done();
                } else {
                    Logger.error({ error: body }, 'Error looking up entity in x-force exchange');
                    done(body);
                }

                return;
            }

            if (entity.isHash) {
                let riskLevel = body.malware.risk;

                Logger.trace({ risk: riskLevel, minimumRisk: minimumRisk }, 'Checking minimum score');

                if (risk[riskLevel] < risk[minimumRisk]) {
                    done();
                    return;
                }
            } else {
                let score = body.score ? body.score : (body.result ? body.result.score : body.score);

                Logger.trace({ score: score, minimumScore: minimumScore }, 'Checking minimum score');

                if (score < minimumScore) {
                    done();
                    return;
                }
            }

            let result = {
                entity: entity,
                data: {
                    summary: ['test'],
                    details: transformer.transform(entity, body)
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

// x-force only seems to accept URLs that start with http or https
function _isValidUrl(url){
    if(url.startsWith('http') || url.startsWith('https')){
        return true;
    }
    return false;
}

function startup(logger) {
    Logger = logger;
    transformer = new Transformer(logger);
    let defaults = {};

    if (typeof config.request.cert === 'string' && config.request.cert.length > 0) {
        defaults.cert = fs.readFileSync(config.request.cert);
    }

    if (typeof config.request.key === 'string' && config.request.key.length > 0) {
        defaults.key = fs.readFileSync(config.request.key);
    }

    if (typeof config.request.passphrase === 'string' && config.request.passphrase.length > 0) {
        defaults.passphrase = config.request.passphrase;
    }

    if (typeof config.request.ca === 'string' && config.request.ca.length > 0) {
        defaults.ca = fs.readFileSync(config.request.ca);
    }

    if (typeof config.request.proxy === 'string' && config.request.proxy.length > 0) {
        defaults.proxy = config.request.proxy;
    }

    if (typeof config.request.rejectUnauthorized === 'boolean') {
        defaults.rejectUnauthorized = config.request.rejectUnauthorized;
    }

    defaults.json = true;

    requestWithDefaults = request.defaults(defaults);
}

function validateStringOption(errors, options, optionName, errMessage) {
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

    validateStringOption(errors, options, 'host', 'You must provide a valid host for the IBM X-Force Exchange server.');
    validateStringOption(errors, options, 'apikey', 'You must provide a valid apikey for authentication with the IBM X-Force Exchange server.');
    validateStringOption(errors, options, 'password', 'You must provide a valid password for authentication with the IBM X-Force Exchange server.');

    let minimumScore = Number(options.minimumScore.value);
    if (options.minimumScore.value.length === 0 || !Number.isInteger(minimumScore)) {
        errors.push({
            key: 'minimumScore',
            message: 'You must provide a valid, numeric, minimum score for Polarity to display.'
        });
    }

    if (typeof options.minimumRisk.value !== 'string' || !['high', 'medium', 'low', ''].includes(options.minimumRisk.value)) {
        errors.push({
            key: 'minimumRisk',
            message: 'Minimum risk must be either "high", "medium", "low", or "" (blank).'
        });
    }

    callback(null, errors);
}

module.exports = {
    doLookup: doLookup,
    startup: startup,
    validateOptions: validateOptions
};
