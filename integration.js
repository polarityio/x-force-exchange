const async = require('async');
const request = require('postman-request');
const config = require('./config/config');
const Transformer = require('./transformer');
const includes = require('lodash.includes');

let previousDomainRegexAsString = '';
let previousIpRegexAsString = '';
let domainBlocklistRegex = null;
let ipBlocklistRegex = null;
let transformer;
let Logger;
let requestWithDefaults;

const risk = {
  high: 3,
  medium: 2,
  low: 1,
  '': 0
};

const DATA_TYPE_ERROR =
  'if this error occurs it means you added data ' + 'types in config.js without updating the code in integration.js';

function _setupRegexBlocklists(options) {
  if (options.domainBlocklistRegex !== previousDomainRegexAsString && options.domainBlocklistRegex.length === 0) {
    Logger.debug('Removing Domain Blocklist Regex Filtering');
    previousDomainRegexAsString = '';
    domainBlocklistRegex = null;
  } else {
    if (options.domainBlocklistRegex !== previousDomainRegexAsString) {
      previousDomainRegexAsString = options.domainBlocklistRegex;
      Logger.debug({ domainBlocklistRegex: previousDomainRegexAsString }, 'Modifying Domain Blocklist Regex');
      domainBlocklistRegex = new RegExp(options.domainBlocklistRegex, 'i');
    }
  }

  if (options.ipBlocklistRegex !== previousIpRegexAsString && options.ipBlocklistRegex.length === 0) {
    Logger.debug('Removing IP Blocklist Regex Filtering');
    previousIpRegexAsString = '';
    ipBlocklistRegex = null;
  } else {
    if (options.ipBlocklistRegex !== previousIpRegexAsString) {
      previousIpRegexAsString = options.ipBlocklistRegex;
      Logger.debug({ ipBlocklistRegex: previousIpRegexAsString }, 'Modifying IP Blocklist Regex');
      ipBlocklistRegex = new RegExp(options.ipBlocklistRegex, 'i');
    }
  }
}

function _isEntityBlocklisted(entityObj, options) {
  const blocklist = options.blocklist;

  Logger.trace({ blocklist: blocklist }, 'checking to see what blocklist looks like');

  if (includes(blocklist, entityObj.value.toLowerCase())) {
    return true;
  }

  if (entityObj.isIPv4 && !entityObj.isPrivateIP) {
    if (ipBlocklistRegex !== null) {
      if (ipBlocklistRegex.test(entityObj.value)) {
        Logger.debug({ ip: entityObj.value }, 'Blocked BlockListed IP Lookup');
        return true;
      }
    }
  }

  if (entityObj.isDomain) {
    if (domainBlocklistRegex !== null) {
      if (domainBlocklistRegex.test(entityObj.value)) {
        Logger.debug({ domain: entityObj.value }, 'Blocked BlockListed Domain Lookup');
        return true;
      }
    }
  }

  return false;
}

function doLookup(entities, options, callback) {
  Logger.trace({ entities: entities, options: options }, 'Entities received');

  let results = [];
  let minimumScore = options.minimumScore;
  let minimumRisk = options.minimumRisk.value ? options.minimumRisk.value : 'low';

  _setupRegexBlocklists(options);

  Logger.trace({ minimumScore: minimumScore, minimumRisk: minimumRisk });

  async.each(
    entities,
    (entity, done) => {
      Logger.trace({ entity: entity }, 'Looking up entity in x-force exchange');

      if (
        (entity.isIP && entity.isPrivateIP) ||
        // skip blocklisted domains or IPs
        _isEntityBlocklisted(entity, options) ||
        // skip invalid URLs (must start with http or https)
        (entity.isURL && !_isValidUrl(entity.value))
      ) {
        Logger.debug(`Ignoring entity '${entity.value}'`);
        return done(null);
      }

      let requestOptions = {
        auth: {
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
      } else if (entity.type === 'cve'){
        requestOptions.url = options.host + '/vulnerabilities/search/' + entity.value;
      } else {
        Logger.error({ entity: entity }, DATA_TYPE_ERROR);
        throw new Error(DATA_TYPE_ERROR);
      }

      requestWithDefaults(requestOptions, function (err, resp, body) {
        Logger.trace({ error: err, body: body }, 'Results of lookup');

        if (err) {
          done({
            detail: 'Error executing HTTPS request',
            debug: err
          });
          return;
        }

        if (resp.statusCode !== 200) {
          if (resp.statusCode === 404) {
            Logger.trace({ id: entity.value }, 'Entity not in x-force exchange');
            results.push({
              entity: entity,
              data: null
            });
            done();
          } else if (resp.statusCode === 400) {
            Logger.error({ error: body }, 'Bad Request');
            done({
              detail: 'Unexpected HTTP Status Code Received',
              debug: body,
              entityValue: entity.value
            });
          } else if (resp.statusCode === 401) {
            Logger.error({ error: body }, 'Invalid Credentials');
            done({
              detail: 'Invalid authentication credentials',
              debug: body,
              entityValue: entity.value
            });
          } else {
            Logger.error({ error: body }, 'Error looking up entity in x-force exchange');
            done({
              detail: 'Unexpected HTTP Status Code Received',
              debug: body,
              response: resp
            });
          }
          return;
        }

        if (entity.isHash) {
          let riskLevel = body.malware.risk;

          Logger.trace({ risk: riskLevel, minimumRisk: minimumRisk }, 'Checking minimum risk');

          if (risk[riskLevel] < risk[minimumRisk]) {
            done();
            return;
          }
        } else {
          let score = body.score ? body.score : body.result ? body.result.score : body.score;

          Logger.trace({ score: score, minimumScore: minimumScore }, 'Checking minimum score');

          if (score < minimumScore) {
            done();
            return;
          }
        }

        const details = transformer.transform(entity, body);
        let result;
        if(details.hasData){
          result = {
            entity: entity,
            data: {
              summary: details.summary,
              details
            }
          };
        } else {
          result = {
            entity,
            data: null
          }
        }

        Logger.trace({ result: result }, 'Result added to list');
        results.push(result);
        done();
      });
    },
    (err) => {
      Logger.trace({ results: results }, 'All entity lookups completed, returning results to client');
      callback(err, results);
    }
  );
}

// x-force only seems to accept URLs that start with http or https
function _isValidUrl(url) {
  if (url.startsWith('http') || url.startsWith('https')) {
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
  if (
    typeof options[optionName].value !== 'string' ||
    (typeof options[optionName].value === 'string' && options[optionName].value.length === 0)
  ) {
    errors.push({
      key: optionName,
      message: errMessage
    });
  }
}

function validateOptions(options, callback) {
  let errors = [];

  validateStringOption(errors, options, 'host', 'You must provide a valid host for the IBM X-Force Exchange server.');
  validateStringOption(
    errors,
    options,
    'apikey',
    'You must provide a valid apikey for authentication with the IBM X-Force Exchange server.'
  );
  validateStringOption(
    errors,
    options,
    'password',
    'You must provide a valid password for authentication with the IBM X-Force Exchange server.'
  );

  let minimumScore = Number(options.minimumScore.value);
  if (options.minimumScore.value.length === 0 || !Number.isInteger(minimumScore)) {
    errors.push({
      key: 'minimumScore',
      message: 'You must provide a valid, numeric, minimum score for Polarity to display.'
    });
  }

  callback(null, errors);
}

module.exports = {
  doLookup: doLookup,
  startup: startup,
  validateOptions: validateOptions
};
