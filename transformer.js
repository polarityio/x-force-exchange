let Details = require('./details');

module.exports = class Transformer {
  constructor(logger) {
    this.logger = logger;
  }

  transform(entity, body) {
    let details = new Details();

    this.logger.trace({ ip: entity.value, body: body }, 'Transforming body to result');

    if (entity.isIP) {
      details.addTitledProperty('Risk Score', body.score);
      details.addSummary(`Risk: ${body.score}`);
      details.addTitledProperty('Reason', body.reason);
      if (body.reasonDescription) {
        details.addTitledProperty('Reason Description', body.reasonDescription);
      }

      if (body.geo) {
        if (body.geo.country && body.geo.countrycode) {
          details.addTitledProperty('Country', body.geo.country + ' - ' + body.geo.countrycode);
          details.addSummary(body.geo.country);
        } else if (body.geo.country) {
          details.addTitledProperty('Country', body.geo.country);
        } else if (body.geo.countrycode) {
          details.addTitledProperty('Country', body.geo.countrycode);
          details.addSummary(body.geo.countrycode);
        }
      }

      if (body.cats && Object.keys(body.cats).length > 0) {
        for (let k in body.cats) {
          details.addHeaderList('Categories', k);
        }
      }

      if (Array.isArray(body.tags)) {
        body.tags.forEach((tag) => {
          details.addSummary(tag.tag);
          details.addTag(tag.tag);
        });
      }

      details.link = 'https://exchange.xforce.ibmcloud.com/ip/' + entity.value;
    } else if (entity.isDomain || entity.isURL) {
      if (body.result) {
        const cats = Object.keys(body.result.cats);

        if(body.result.score === null && cats.length === 0 && !body.result.application){
          details.hasData = false;
          return details;
        }

        details.addTitledProperty('Risk', body.result.score);
        details.addSummary(`Risk: ${body.result.score}`);

        if (cats.length > 0) {
          details.addSummary(cats.slice(0, 2).join(','));
          cats.forEach((cat) => {
            details.addHeaderList('Categories', cat);
          });
        }

        if (body.result.application) {
          if (body.result.application.riskfactors) {
            Object.keys(body.result.application.riskfactors).forEach((factor) => {
              details.addHeaderList('Risk Factors', factor);
            });
          }
        }
      }

      if (body.associated) {
        body.associated
          .filter((entry) => entry.url)
          .map((entry) => entry.url)
          .forEach((url) => {
            details.addHeaderList('Associated', url);
          });
      }

      details.link = 'https://exchange.xforce.ibmcloud.com/url/' + entity.value;
    } else if (entity.isHash) {
      details.addSummary(`Risk: ${body.malware.risk}`);

      details.addTitledProperty('Risk', body.malware.risk);
      details.addTitledProperty('Type', body.malware.type);
      if (body.malware && body.malware.origins && body.malware.origins.external) {
        if (body.malware.origins.external.source) {
          details.addTitledProperty('Source', body.malware.origins.external.source);
        }
        if (body.malware.origins.external.firstSeen) {
          details.addTitledProperty('First Seen', body.malware.origins.external.firstSeen);
        }
        if (body.malware.origins.external.lastSeen) {
          details.addTitledProperty('Last Seen', body.malware.origins.external.lastSeen);
        }
        if (body.malware.origins.external.detectionCoverage) {
          details.addTitledProperty('Detection Coverage', body.malware.origins.external.detectionCoverage);
        }
      }

      const familySet = new Set();

      if (body.malware.family && body.malware.family.length > 0) {
        body.malware.family.forEach((family) => {
          familySet.add(family);
          details.addHeaderList('Families', family);
        });
      }

      if (body.malware.origins && body.malware.origins.external && body.malware.origins.external.family) {
        body.malware.origins.external.family.forEach((family) => {
          familySet.add(family);
          details.addHeaderList('Families', family);
        });
      }

      [...familySet].forEach((family) => {
        details.addSummary(family);
      });

      body.tags.forEach((tag) => {
        details.addSummary(tag.tag);
        details.addTag(tag.tag);
      });

      details.link = 'https://exchange.xforce.ibmcloud.com/malware/' + entity.value;
    } else if (entity.type === 'cve') {
      let result = null;
      if (Array.isArray(body) && body.length > 0) {
        result = body[0];
      }
      details.addSummary(result.title);
      details.link = `https://exchange.xforce.ibmcloud.com/vulnerabilities/${result.xfdbid}`;
      details.raw = result;
    } else {
      this.logger.error({ entity: entity }, DATA_TYPE_ERROR);
      throw new Error(DATA_TYPE_ERROR);
    }

    this.logger.trace({ details: details }, 'Transformed details');

    return details;
  }
};
