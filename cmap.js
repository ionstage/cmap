(function(global) {
  'use strict';

  var prop = function(initialValue) {
    var cache = initialValue;
    return function(value) {
      if (typeof value === 'undefined')
        return cache;
      cache = value;
    };
  };

  var Node = function(option) {
    this.text = prop(option.text || '');
    this.x = prop(option.x || 0);
    this.y = prop(option.y || 0);
    this.width = prop(option.width || 75);
    this.height = prop(option.height || 30);
  };

  var Link = function(option) {
    this.text = prop(option.text || '');
    this.source = prop(option.source || null);
    this.target = prop(option.target || null);
  };

  var Paper = function() {
    this.nodeList = prop([]);
    this.linkList = prop([]);
  };

  Paper.prototype.node = function(option) {
    var node = new Node(option);
    var nodeList = this.nodeList();
    nodeList.push(node);
    return node;
  };

  Paper.prototype.link = function(option) {
    var link = new Link(option);
    var linkList = this.linkList();
    linkList.push(link);
    return link;
  };

  var Cmap = function() {
    return new Paper();
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = Cmap;
  else
    global.Cmap = Cmap;
})(this);