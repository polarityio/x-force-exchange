let Details = require('./details');

module.exports = class Transformer {
    constructor(logger) {
        this.logger = logger;
    }

    transform(entity, body) {
        let details = new Details();

        this.logger.trace({ ip: entity.value, body: body }, 'Transforming body to result');

        if (entity.isIP) {
            details.addTitledProperty('Score', body.score);
            details.addSummary(body.score)
            details.addTitledProperty('Reason', body.reason);

            if (body.geo) {
                if (body.geo.country && body.geo.countrycode) {
                    details.addTitledProperty('Country', body.geo.country + ' - ' + body.geo.countrycode);
                    details.addSummary(body.geo.countrycode);
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

            details.link = 'https://exchange.xforce.ibmcloud.com/ip/' + entity.value;
        } else if (entity.isDomain || entity.isURL) {
            if (body.result) {
                details.addTitledProperty('Score', body.result.score);
                details.addSummary(body.result.score);

                let cats = Object.keys(body.result.cats);

                if (cats.length > 0) {
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
                    .filter(entry => entry.url)
                    .map(entry => entry.url)
                    .forEach((url) => {
                        details.addHeaderList('Associated', url);
                    });
            }

            details.link = 'https://exchange.xforce.ibmcloud.com/url/' + entity.value;
        } else if (entity.isHash) {
            details.addSummary(body.malware.risk);
            details.addSummary(body.malware.type);

            details.addTitledProperty('Risk', body.malware.risk);
            details.addTitledProperty('Type', body.malware.type);

            if (body.malware.family && body.malware.family.length > 0) {
                body.malware.family.forEach((family) => {
                    details.addSummary(family);
                    details.addHeaderList('Families', family);
                });
            }

            if (body.malware.origins && body.malware.origins.external && body.malware.origins.external.family) {
                body.malware.origins.external.family.forEach((family) => {
                    details.addHeaderList('Families', family);
                });
            }

            body.tags.forEach((tag) => {
                details.addSummary(tag.tag);
                details.addTag(tag.tag);
            });

            details.link = 'https://exchange.xforce.ibmcloud.com/malware/' + entity.value;
        } else {
            this.logger.error({ entity: entity }, DATA_TYPE_ERROR);
            throw new Error(DATA_TYPE_ERROR);
        }

        this.logger.trace({ details: details }, 'Transformed details');

        return details;
    }
}
