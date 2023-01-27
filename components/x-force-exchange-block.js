polarity.export = PolarityComponent.extend({
  viewReferences: false,
  maxCodesDefault: 5,
  maxCodes: 5,
  viewAllCodes: false,
  enableCodePaging: Ember.computed('details.raw.stdcode.length', 'maxCodesDefault', function(){
    return this.get('details.raw.stdcode.length') > this.get('maxCodesDefault');
  }),
  details: Ember.computed.alias('block.data.details'),
  actions: {
    viewReferences: function () {
      this.toggleProperty('viewReferences');
    },
    viewAllCodes: function () {
      if (this.get('maxCodes') === this.get('maxCodesDefault')) {
        this.set('maxCodes', this.get('details.raw.stdcode.length'));
      } else {
        this.set('maxCodes', this.get('maxCodesDefault'));
      }
      this.toggleProperty('viewAllCodes');
    }
  }
});
