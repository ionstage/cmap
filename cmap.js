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
    this.cmap = prop(null);
  };

  Node.prototype.remove = function() {
    var cmap = this.cmap();
    if (!cmap)
      return;

    var nodeList = cmap.nodeList();
    var index = nodeList.indexOf(this);
    if (index !== -1)
      nodeList.splice(index, 1);
  };

  var Link = function(option) {
    this.text = prop(option.text || '');
    this.source = prop(option.source || null);
    this.target = prop(option.target || null);
    this.cmap = prop(null);
  };

  Link.prototype.remove = function() {
    var cmap = this.cmap();
    if (!cmap)
      return;

    var linkList = cmap.linkList();
    var index = linkList.indexOf(this);
    if (index !== -1)
      linkList.splice(index, 1);
  };

  var Cmap = function() {
    if (!(this instanceof Cmap))
      return new Cmap();

    this.nodeList = prop([]);
    this.linkList = prop([]);
  };

  Cmap.prototype.node = function(option) {
    var node = new Node(option || {});
    var nodeList = this.nodeList();
    node.cmap(this);
    nodeList.push(node);
    return node;
  };

  Cmap.prototype.link = function(option) {
    var link = new Link(option || {});
    var linkList = this.linkList();
    link.cmap(this);
    linkList.push(link);
    return link;
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = Cmap;
  else
    global.Cmap = Cmap;
})(this);