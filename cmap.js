(function(global) {
  'use strict';

  var prop = function(initialValue) {
    var cache = initialValue;
    return function(value) {
      if (typeof value === 'undefined')
        return cache;
      cache = value;
      markDirty(this);
    };
  };

  var markDirty = (function() {
    var dirtyComponents = [];
    var requestId = null;
    var callback = function() {
      dirtyComponents.forEach(function(component) {
        component.redraw();
      });
      dirtyComponents = [];
      requestId = null;
    };
    return function(component) {
      if (dirtyComponents.indexOf(component) === -1)
        dirtyComponents.push(component);
      if (requestId !== null)
        return;
      requestId = dom.animate(callback);
    };
  })();

  var diffObj = function(newObj, oldObj) {
    var diff = {};
    for (var key in newObj) {
      if (newObj[key] !== oldObj[key])
        diff[key] = newObj[key];
    }
    return diff;
  };

  var dom = {};

  dom.el = function(selector) {
    if (selector[0] === '<') {
      selector = selector.match(/<(.+)>/)[1];
      return document.createElement(selector);
    }
    return document.querySelector(selector);
  };

  dom.css = function(el, props) {
    var style = el.style;
    for (var prop in props) {
      style[prop] = props[prop];
    }
  };

  dom.append = function(parent, el) {
    parent.appendChild(el);
  };

  dom.remove = function(el) {
    el.parentNode.removeChild(el);
  };

  dom.text = function(el, s) {
    el.textContent = s;
  };

  dom.animate = function(callback) {
    return window.requestAnimationFrame(callback);
  };

  var Node = function(option) {
    this.text = prop(option.text || '');
    this.x = prop(option.x || 0);
    this.y = prop(option.y || 0);
    this.width = prop(option.width || 75);
    this.height = prop(option.height || 30);
    this.backgroundColor = prop(option.backgroundColor || '#a7cbe6');
    this.borderColor = prop(option.borderColor || '#333');
    this.borderWidth = prop(option.borderWidth || 2);
    this.textColor = prop(option.textColor || '#333');
    this.cmap = prop(null);
    this.element = prop(dom.el('<div>'));
    this.cache = prop({});
  };

  Node.prototype.remove = function() {
    var cmap = this.cmap();
    if (!cmap)
      return;

    var nodeList = cmap.nodeList();
    var index = nodeList.indexOf(this);
    if (index !== -1)
      nodeList.splice(index, 1);
    this.cmap(null);
    dom.remove(this.element());
  };

  Node.prototype.style = function() {
    var translate = 'translate(' + this.x() + 'px, ' + this.y() + 'px)';
    return {
      backgroundColor: this.backgroundColor(),
      border: this.borderWidth() + 'px solid ' + this.borderColor(),
      borderRadius: '4px',
      color: this.textColor(),
      height: this.height() + 'px',
      lineHeight: this.height() + 'px',
      MozTransform: translate,
      msTransform: translate,
      overflow: 'hidden',
      position: 'absolute',
      textAlign: 'center',
      textOverflow: 'ellipsis',
      transform: translate,
      webkitTransform: translate,
      whiteSpace: 'nowrap',
      width: this.width() + 'px'
    };
  };

  Node.prototype.redraw = function() {
    var text = this.text();
    var style = this.style();
    var element = this.element();
    var cache = this.cache();

    if (text !== cache.text) {
      dom.text(element, text);
      cache.text = text;
    }

    var diffStyle = diffObj(style, cache.style || {});
    dom.css(element, diffStyle);
    cache.style = style;
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
    this.cmap(null);
  };

  var Cmap = function(element) {
    if (!(this instanceof Cmap))
      return new Cmap(element);

    this.nodeList = prop([]);
    this.linkList = prop([]);

    if (!element)
      element = dom.el('<div>');

    dom.css(element, this.style());
    this.element = prop(element);
  };

  Cmap.prototype.node = function(option) {
    var node = new Node(option || {});
    var nodeList = this.nodeList();
    node.cmap(this);
    nodeList.push(node);
    dom.append(this.element(), node.element());
    return node;
  };

  Cmap.prototype.link = function(option) {
    var link = new Link(option || {});
    var linkList = this.linkList();
    link.cmap(this);
    linkList.push(link);
    return link;
  };

  Cmap.prototype.style = function() {
    return {
      color: '#333',
      cursor: 'default',
      fontFamily: 'sans-serif',
      fontSize: '14px',
      MozUserSelect: 'none',
      msUserSelect: 'none',
      position: 'relative',
      userSelect: 'none',
      webkitUserSelect: 'none'
    };
  };

  Cmap.dom = dom;

  if (typeof module !== 'undefined' && module.exports)
    module.exports = Cmap;
  else
    global.Cmap = Cmap;
})(this);