polarity.export = PolarityComponent.extend({
  viewReferences: false,
  details: Ember.computed.alias('block.data.details'),
  actions: {
    viewReferences: function () {
      this.toggleProperty('viewReferences');
    }
  }
});
