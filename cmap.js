(function(global) {
  'use strict';
  var cmap = {};

  var prop = function(initialValue) {
    var cache = initialValue;
    return function(value) {
      if (typeof value === 'undefined')
        return cache;
      cache = value;
    };
  };

  var Node = function(option) {
    this.label = prop(option.label || '');
    this.x = prop(option.x || 0);
    this.y = prop(option.y || 0);
    this.width = prop(option.width || 75);
    this.height = prop(option.height || 30);
  };

  var Link = function(option) {
    this.label = prop(option.label || '');
    this.source = prop(option.source || null);
    this.target = prop(option.target || null);
  };

  cmap.Node = Node;
  cmap.Link = Link;

  if (typeof module !== 'undefined' && module.exports)
    module.exports = cmap;
  else
    global.cmap = cmap;
})(this);