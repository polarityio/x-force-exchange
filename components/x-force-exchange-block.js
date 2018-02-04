polarity.export = PolarityComponent.extend({
    details: Ember.computed.alias('block.data.details'),
    hasTags: Ember.computed(function () {
        return this.get('block.data.details').tags.length > 0;
    }),
    hasCategories: Ember.computed(function () {
        return Object.keys(this.get('block.data.details').cats).length > 0;
    }),
    hasCountry: Ember.computed(function () {
        return !!this.get('block.data.details').geo;
    })
});
