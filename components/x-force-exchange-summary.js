polarity.export = PolarityComponent.extend({
    details: Ember.computed.alias('block.data.details'),
    tags: Ember.computed.alias('block.data.details.summary')
});
