polarity.export = PolarityComponent.extend({
    details: Ember.computed.alias('block.data.details'),
    tags: Ember.computed(function () {
        var details = this.get('block.data.details');
        var tags = [];

        tags.push(details.score);

        if (details.geo.countrycode) {
            tags.push(details.geo.countrycode);
        }

        details.tags.forEach(function (tag) {
            tags.push(tag);
        });

        return tags;
    })
});
