polarity.export = PolarityComponent.extend({
    details: Ember.computed.alias('block.data.details'),
    tags: Ember.computed(function () {
        // collect the values to display in the summary and return as a list 
        // of string

        return ['example', 'tags', 'to', 'display'];
    })
});
