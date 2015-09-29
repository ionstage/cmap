(function(global) {
  'use strict';

  var helper = {};

  helper.inherits = function(ctor, superCtor) {
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    return ctor;
  };

  helper.diffObj = function(newObj, oldObj) {
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
  };

  dom.attr = function(el, props) {
    for (var prop in props) {
      el.setAttribute(prop, props[prop]);
    }
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

  var Component = function() {};

  Component.prototype.prop = function(initialValue) {
    var cache = initialValue;
    return function(value) {
      if (typeof value === 'undefined')
        return cache;
      cache = value;
      this.markDirty();
    };
  };

  Component.prototype.markDirty = (function() {
    var dirtyComponents = [];
    var requestId = null;
    var callback = function() {
      dirtyComponents.forEach(function(component) {
        component.redraw();
      });
      dirtyComponents = [];
      requestId = null;
    };
    return function() {
      if (typeof document === 'undefined')
        return;
      if (dirtyComponents.indexOf(this) === -1)
        dirtyComponents.push(this);
      if (requestId !== null)
        return;
      requestId = dom.animate(callback);
    };
  })();

  var Node = helper.inherits(function(option) {
    this.content = this.prop(option.content || '');
    this.contentType = this.prop(option.contentType || Node.CONTENT_TYPE_TEXT);
    this.x = this.prop(option.x || 0);
    this.y = this.prop(option.y || 0);
    this.width = this.prop(option.width || 75);
    this.height = this.prop(option.height || 30);
    this.backgroundColor = this.prop(option.backgroundColor || '#a7cbe6');
    this.borderColor = this.prop(option.borderColor || '#333');
    this.borderWidth = this.prop(option.borderWidth || 2);
    this.textColor = this.prop(option.textColor || '#333');
    this.element = this.prop(null);
    this.parentElement = this.prop(null);
    this.cache = this.prop({});
  }, Component);

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
    var borderWidthOffset = this.borderWidth() * 2;
    return {
      backgroundColor: this.backgroundColor(),
      border: this.borderWidth() + 'px solid ' + this.borderColor(),
      borderRadius: '4px',
      color: this.textColor(),
      height: (this.height() - borderWidthOffset) + 'px',
      lineHeight: (lineHeight - borderWidthOffset) + 'px',
      MozTransform: translate,
      msTransform: translate,
      overflow: 'hidden',
      pointerEvents: 'none',
      position: 'absolute',
      textAlign: textAlign,
      textOverflow: 'ellipsis',
      transform: translate,
      webkitTransform: translate,
      whiteSpace: 'nowrap',
      width: (this.width() - borderWidthOffset) + 'px'
    };
  };

  Node.prototype.redraw = function() {
    var content = this.content();
    var contentType = this.contentType();
    var style = this.style();
    var element = this.element();
    var parentElement = this.parentElement();
    var cache = this.cache();

    if (!parentElement && !element)
      return;

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

    if (cache.style)
      style = helper.diffObj(style, cache.style);

    dom.css(element, style);
    cache.style = style;
  };

  Node.CONTENT_TYPE_TEXT = 'text';
  Node.CONTENT_TYPE_HTML = 'html';

  var Link = helper.inherits(function(option) {
    this.content = this.prop(option.content || '');
    this.contentType = this.prop(option.contentType || Link.CONTENT_TYPE_TEXT);
    this.x = this.prop(option.x || 100);
    this.y = this.prop(option.y || 40);
    this.width = this.prop(option.width || 50);
    this.height = this.prop(option.height || 20);
    this.backgroundColor = this.prop(option.backgroundColor || 'white');
    this.borderColor = this.prop(option.borderColor || '#333');
    this.borderWidth = this.prop(option.borderWidth || 2);
    this.textColor = this.prop(option.textColor || '#333');
    this.sourceX = this.prop(option.sourceX || option.x - 70 || 30);
    this.sourceY = this.prop(option.sourceY || option.y || 40);
    this.targetX = this.prop(option.targetX || option.x + 70 || 170);
    this.targetY = this.prop(option.targetY || option.y || 40);
    this.lineColor = this.prop(option.lineColor || '#333');
    this.lineWidth = this.prop(option.lineWidth || 2);
    this.element = this.prop(null);
    this.parentElement = this.prop(null);
    this.cache = this.prop({});
  }, Component);

  Link.prototype.text = function(text) {
    if (typeof text === 'undefined')
      return this.content();
    this.content(text);
    this.contentType(Link.CONTENT_TYPE_TEXT);
  };

  Link.prototype.html = function(html) {
    if (typeof html === 'undefined')
      return this.content();
    this.content(html);
    this.contentType(Link.CONTENT_TYPE_HTML);
  };

  Link.prototype.pathContainerStyle = function() {
    return {
      overflow: 'visible',
      position: 'absolute'
    };
  };

  Link.prototype.pathAttributes = function() {
    var d = ['M', this.sourceX(), this.sourceY(),
             'L', this.x(), this.y(),
             'L', this.targetX(), this.targetY()].join(' ');
    return {
      d: d,
      fill: 'none',
      stroke: this.lineColor(),
      'stroke-linecap': 'round',
      'stroke-width': this.lineWidth()
    };
  };

  Link.prototype.contentStyle = function() {
    var contentType = this.contentType();
    var lineHeight = (contentType === Link.CONTENT_TYPE_TEXT) ? this.height() : 14;
    var textAlign = (contentType === Link.CONTENT_TYPE_TEXT) ? 'center' : 'left';
    var x = this.x() - this.width() / 2;
    var y = this.y() - this.height() / 2;
    var translate = 'translate(' + x + 'px, ' + y + 'px)';
    var borderWidthOffset = this.borderWidth() * 2;
    return {
      backgroundColor: this.backgroundColor(),
      border: this.borderWidth() + 'px solid ' + this.borderColor(),
      borderRadius: '4px',
      color: this.textColor(),
      height: (this.height() - borderWidthOffset) + 'px',
      lineHeight: (lineHeight - borderWidthOffset) + 'px',
      MozTransform: translate,
      msTransform: translate,
      overflow: 'hidden',
      position: 'absolute',
      textAlign: textAlign,
      textOverflow: 'ellipsis',
      transform: translate,
      webkitTransform: translate,
      whiteSpace: 'nowrap',
      width: (this.width() - borderWidthOffset) + 'px'
    };
  };

  Link.prototype.redraw = function() {
    var content = this.content();
    var contentType = this.contentType();
    var pathAttributes = this.pathAttributes();
    var contentStyle = this.contentStyle();
    var element = this.element();
    var parentElement = this.parentElement();
    var cache = this.cache();

    var pathContainerElement;
    var pathElement;
    var contentElement;

    if (!parentElement && !element)
      return;

    // add element
    if (parentElement && !element) {
      element = dom.el('<div>');
      this.element(element);
      dom.css(element, {pointerEvents: 'none'});
      dom.html(element, '<svg><path></path></svg><div></div>');
      pathContainerElement = element.children[0];
      dom.css(pathContainerElement, this.pathContainerStyle());
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

    // update path element
    pathElement = element.children[0].childNodes[0];

    if (cache.pathAttributes)
      pathAttributes = helper.diffObj(pathAttributes, cache.pathAttributes);

    dom.attr(pathElement, pathAttributes);
    cache.pathAttributes = pathAttributes;

    // update content element
    contentElement = element.children[1];

    if (content !== cache.content) {
      if (contentType === Link.CONTENT_TYPE_TEXT)
        dom.text(contentElement, content);
      else if (contentType === Link.CONTENT_TYPE_HTML)
        dom.html(contentElement, content);
      cache.content = content;
    }

    if (cache.contentStyle)
      contentStyle = helper.diffObj(contentStyle, cache.contentStyle);

    dom.css(contentElement, contentStyle);
    cache.contentStyle = contentStyle;
  };

  Link.CONTENT_TYPE_TEXT = 'text';
  Link.CONTENT_TYPE_HTML = 'html';

  var Connector = helper.inherits(function(option) {
    this.x = this.prop(option.x || 0);
    this.y = this.prop(option.y || 0);
    this.r = this.prop(option.r || 16);
    this.color = this.prop(option.color || Connector.COLOR_UNCONNECTED);
    this.element = this.prop(null);
    this.parentElement = this.prop(null);
  }, Component);

  Connector.prototype.style = function() {
    var x = this.x() - this.r();
    var y = this.y() - this.r();
    var translate = 'translate(' + x + 'px, ' + y + 'px)';
    return {
      backgroundColor: this.color(),
      borderRadius: this.r() + 'px',
      height: this.r() * 2 + 'px',
      MozTransform: translate,
      msTransform: translate,
      opacity: 0.6,
      pointerEvents: 'none',
      position: 'absolute',
      transform: translate,
      webkitTransform: translate,
      width: this.r() * 2 + 'px'
    };
  };

  Connector.prototype.redraw = function() {
    var style = this.style();
    var element = this.element();
    var parentElement = this.parentElement();

    if (!parentElement && !element)
      return;

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
      return;
    }

    dom.css(element, style);
  };

  Connector.COLOR_CONNECTED = 'lightgreen';
  Connector.COLOR_UNCONNECTED = 'pink';

  var ComponentList = function() {
    this.data = [];
  };

  ComponentList.prototype.add = function(component) {
    var data = this.data;
    if (data.indexOf(component) === -1)
      data.push(component);
  };

  ComponentList.prototype.remove = function(component) {
    var data = this.data;
    var index = data.indexOf(component);
    if (index !== -1)
      data.splice(index, 1);
  };

  ComponentList.prototype.each = function(callback) {
    return this.data.forEach(callback);
  };

  var Cmap = helper.inherits(function(element) {
    if (!(this instanceof Cmap))
      return new Cmap(element);

    this.componentList = this.prop(new ComponentList());
    this.element = this.prop(element || null);

    this.markDirty();
  }, Component);

  Cmap.prototype.createNode = function(option) {
    return new Node(option || {});
  };

  Cmap.prototype.createLink = function(option) {
    return new Link(option || {});
  };

  Cmap.prototype.createConnector = function(option) {
    return new Connector(option || {});
  };

  Cmap.prototype.add = function(child) {
    child.parentElement(this.element());
    this.componentList().add(child);
  };

  Cmap.prototype.remove = function(child) {
    child.parentElement(null);
    this.componentList().remove(child);
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
    var componentList = this.componentList();
    var element = this.element();

    if (!element) {
      element = dom.el('<div>');
      this.element(element);
      componentList.each(function(component) {
        component.parentElement(element);
      });
    }

    dom.css(element, this.style());
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = Cmap;
  else
    global.Cmap = Cmap;
})(this);