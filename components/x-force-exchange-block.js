polarity.export = PolarityComponent.extend({
    details: Ember.computed.alias('block.data.details'),
    hasTags: Ember.computed(function () {
        let details = this.get('block.data.details');
        return details.tags ? details.tags.length > 0 : false;
    }),
    hasReason: Ember.computed(function () {
        return !!this.get('block.data.details').reason;
    }),
    hasDescription: Ember.computed(function () {
        return !!this.get('block.data.details').reasonDescription;
    }),
    hasCategories: Ember.computed(function () {
        let details = this.get('block.data.details');
        return details.cats ? Object.keys(details.cats).length > 0 : false;
    }),
    hasCountry: Ember.computed(function () {
        let details = this.get('block.data.details');
        return details.geo ? !!details.geo.country : false;
    }),
    hasCountryCode: Ember.computed(function () {
        let details = this.get('block.data.details');
        return details.geo ? !!details.geo.countrycode : false;
    })
});
