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
      if (typeof document === 'undefined')
        return;
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

  dom.html = function(el, s) {
    el.innerHTML = s;
  };

  dom.animate = function(callback) {
    return window.requestAnimationFrame(callback);
  };

  var Node = function(option) {
    this.content = prop(option.content || '');
    this.contentType = prop(option.contentType || Node.CONTENT_TYPE_TEXT);
    this.x = prop(option.x || 0);
    this.y = prop(option.y || 0);
    this.width = prop(option.width || 75);
    this.height = prop(option.height || 30);
    this.backgroundColor = prop(option.backgroundColor || '#a7cbe6');
    this.borderColor = prop(option.borderColor || '#333');
    this.borderWidth = prop(option.borderWidth || 2);
    this.textColor = prop(option.textColor || '#333');
    this.element = prop(null);
    this.parentElement = prop(null);
    this.cache = prop({});
  };

  Node.prototype.text = function(text) {
    if (typeof text === 'undefined')
      return this.content();
    this.content(text);
    this.contentType(Node.CONTENT_TYPE_TEXT);
  };

  Node.prototype.html = function(html) {
    if (typeof html === 'undefined')
      return this.content();
    this.content(html);
    this.contentType(Node.CONTENT_TYPE_HTML);
  };

  Node.prototype.style = function() {
    var contentType = this.contentType();
    var lineHeight = (contentType === Node.CONTENT_TYPE_TEXT) ? this.height() : 14;
    var textAlign = (contentType === Node.CONTENT_TYPE_TEXT) ? 'center' : 'left';
    var translate = 'translate(' + this.x() + 'px, ' + this.y() + 'px)';
    return {
      backgroundColor: this.backgroundColor(),
      border: this.borderWidth() + 'px solid ' + this.borderColor(),
      borderRadius: '4px',
      color: this.textColor(),
      height: this.height() + 'px',
      lineHeight: lineHeight + 'px',
      MozTransform: translate,
      msTransform: translate,
      overflow: 'hidden',
      position: 'absolute',
      textAlign: textAlign,
      textOverflow: 'ellipsis',
      transform: translate,
      webkitTransform: translate,
      whiteSpace: 'nowrap',
      width: this.width() + 'px'
    };
  };

  Node.prototype.redraw = function() {
    var content = this.content();
    var contentType = this.contentType();
    var style = this.style();
    var element = this.element();
    var parentElement = this.parentElement();
    var cache = this.cache();

    // add element
    if (parentElement && !element) {
      element = dom.el('<div>');
      this.element(element);
      this.redraw();
      dom.append(parentElement, element);
      return;
    }

    // remove element
    if (!parentElement && element) {
      dom.remove(element);
      this.element(null);
      this.cache({});
      return;
    }

    if (content !== cache.content) {
      if (contentType === Node.CONTENT_TYPE_TEXT)
        dom.text(element, content);
      else if (contentType === Node.CONTENT_TYPE_HTML)
        dom.html(element, content);
      cache.content = content;
    }

    var diffStyle = diffObj(style, cache.style || {});
    dom.css(element, diffStyle);
    cache.style = style;
  };

  Node.CONTENT_TYPE_TEXT = 'text';
  Node.CONTENT_TYPE_HTML = 'html';

  var Link = function(option) {
    this.text = prop(option.text || '');
    this.source = prop(option.source || null);
    this.target = prop(option.target || null);
    this.element = prop(null);
    this.parentElement = prop(null);
  };

  Link.prototype.redraw = function() {
    var element = this.element();
    var parentElement = this.parentElement();

    // add element
    if (parentElement && !element) {
      element = dom.el('<div>');
      this.element(element);
      dom.append(parentElement, element);
      return;
    }

    // remove element
    if (!parentElement && element) {
      dom.remove(element);
      this.element(null);
      this.cache({});
      return;
    }
  };

  var Cmap = function(element) {
    if (!(this instanceof Cmap))
      return new Cmap(element);

    this.nodeList = prop([]);
    this.linkList = prop([]);
    this.element = prop(element);

    markDirty(this);
  };

  Cmap.prototype.createNode = function(option) {
    return new Node(option || {});
  };

  Cmap.prototype.createLink = function(option) {
    return new Link(option || {});
  };

  Cmap.prototype.add = function(child) {
    var list;

    if (child instanceof Node)
      list = this.nodeList();
    else if (child instanceof Link)
      list = this.linkList();
    else
      return;

    var index = list.indexOf(child);
    if (index === -1)
      list.push(child);

    child.parentElement(this.element());
  };

  Cmap.prototype.remove = function(child) {
    var list;

    if (child instanceof Node)
      list = this.nodeList();
    else if (child instanceof Link)
      list = this.linkList();
    else
      return;

    var index = list.indexOf(child);
    if (index !== -1)
      list.splice(index, 1);

    child.parentElement(null);
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

  Cmap.prototype.redraw = function() {
    var element = this.element();

    if (!element) {
      element = dom.el('<div>');
      this.element(element);
    }

    dom.css(element, this.style());
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = Cmap;
  else
    global.Cmap = Cmap;
})(this);