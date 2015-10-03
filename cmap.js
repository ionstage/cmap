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

      if (value === cache)
        return;

      cache = value;
      this.markDirty();
    };
  };

  Component.prototype.relations = function() {
    return [];
  };

  Component.prototype.redraw = function() {};

  Component.prototype.markDirty = (function() {
    var dirtyComponents = [];
    var requestId = null;

    var callback = function() {
      dirtyComponents.forEach(function(component) {
        component.relations().forEach(function(relation) {
          relation.update(component);
        });
      });

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
    this.relations = this.prop([]);
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

      this.cache({});

      return;
    }

    var cache = this.cache();
    var content = this.content();
    var contentType = this.contentType();

    if (content !== cache.content) {
      if (contentType === Node.CONTENT_TYPE_TEXT)
        dom.text(element, content);
      else if (contentType === Node.CONTENT_TYPE_HTML)
        dom.html(element, content);

      cache.content = content;
    }

    var style = this.style();

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
    this.cx = this.prop(option.cx || 100);
    this.cy = this.prop(option.cy || 40);
    this.width = this.prop(option.width || 50);
    this.height = this.prop(option.height || 20);
    this.backgroundColor = this.prop(option.backgroundColor || 'white');
    this.borderColor = this.prop(option.borderColor || '#333');
    this.borderWidth = this.prop(option.borderWidth || 2);
    this.textColor = this.prop(option.textColor || '#333');
    this.sourceX = this.prop(option.sourceX || this.cx() - 70);
    this.sourceY = this.prop(option.sourceY || this.cy());
    this.targetX = this.prop(option.targetX || this.cx() + 70);
    this.targetY = this.prop(option.targetY || this.cy());
    this.lineColor = this.prop(option.lineColor || '#333');
    this.lineWidth = this.prop(option.lineWidth || 2);
    this.hasArrow = this.prop(!!option.hasArrow);
    this.element = this.prop(null);
    this.parentElement = this.prop(null);
    this.cache = this.prop({});
    this.relations = this.prop([]);
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

  Link.prototype.lineAttributes = function() {
    var d = [
      'M', this.sourceX(), this.sourceY(),
      'L', this.cx(), this.cy(),
      'L', this.targetX(), this.targetY()
    ].join(' ');

    return {
      d: d,
      fill: 'none',
      stroke: this.lineColor(),
      'stroke-linecap': 'round',
      'stroke-width': this.lineWidth()
    };
  };

  Link.prototype.arrowAttributes = function() {
    var cx = this.cx();
    var cy = this.cy();
    var tx = this.targetX();
    var ty = this.targetY();

    var radians = Math.atan2(ty - cy, tx - cx);

    var p0 = {
      x: 15 * Math.cos(radians - 26 * Math.PI / 180),
      y: 15 * Math.sin(radians - 26 * Math.PI / 180)
    };

    var p1 = {
      x: 15 * Math.cos(radians + 26 * Math.PI / 180),
      y: 15 * Math.sin(radians + 26 * Math.PI / 180)
    };

    var p2 = {
      x: 7 * Math.cos(radians),
      y: 7 * Math.sin(radians)
    };

    var d = [
      'M', tx - p0.x, ty - p0.y,
      'L', tx, ty,
      'L', tx - p1.x, ty - p1.y,
      'Q', tx - p2.x, ty - p2.y, tx - p0.x, ty - p0.y,
      'Z'
    ].join(' ');

    return {
      d: d,
      fill: this.lineColor(),
      stroke: this.lineColor(),
      'stroke-linejoin': 'round',
      'stroke-width': this.lineWidth(),
      visibility: this.hasArrow() ? 'visible' : 'hidden'
    };
  };

  Link.prototype.contentStyle = function() {
    var contentType = this.contentType();
    var lineHeight = (contentType === Link.CONTENT_TYPE_TEXT) ? this.height() : 14;
    var textAlign = (contentType === Link.CONTENT_TYPE_TEXT) ? 'center' : 'left';
    var x = this.cx() - this.width() / 2;
    var y = this.cy() - this.height() / 2;
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
    var element = this.element();
    var parentElement = this.parentElement();

    if (!parentElement && !element)
      return;

    // add element
    if (parentElement && !element) {
      element = dom.el('<div>');
      this.element(element);

      dom.css(element, {pointerEvents: 'none'});
      dom.html(element, '<svg><path></path><path></path></svg><div></div>');

      var pathContainerElement = element.children[0];
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

    var cache = this.cache();

    // update line element
    var lineAttributes = this.lineAttributes();
    var lineElement = element.children[0].childNodes[0];

    if (cache.lineAttributes)
      lineAttributes = helper.diffObj(lineAttributes, cache.lineAttributes);

    dom.attr(lineElement, lineAttributes);
    cache.lineAttributes = lineAttributes;

    // update arrow element
    var arrowAttributes = this.arrowAttributes();
    var arrowElement = element.children[0].childNodes[1];

    if (cache.arrowAttributes)
      arrowAttributes = helper.diffObj(arrowAttributes, cache.arrowAttributes);

    dom.attr(arrowElement, arrowAttributes);
    cache.arrowAttributes = arrowAttributes;

    // update content element
    var content = this.content();
    var contentType = this.contentType();
    var contentStyle = this.contentStyle();
    var contentElement = element.children[1];

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

    dom.css(element, this.style());
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

  var Relation = function() {};

  Relation.prototype.prop = function(initialValue) {
    var cache = initialValue;

    return function(value) {
      if (typeof value === 'undefined')
        return cache;

      cache = value;
    };
  };

  Relation.prototype.update = function() {};

  var Connection = helper.inherits(function(option) {
    this.type = this.prop(option.type || Connection.TYPE_UNDEFINED);
    this.node = this.prop(option.node || null);
    this.link = this.prop(option.link || null);
  }, Relation);

  Connection.prototype.update = function() {
    var type = this.type();
    var link = this.link();
    var point = this.point();

    link[type + 'X'](point.x);
    link[type + 'Y'](point.y);
  };

  Connection.prototype.point = function() {
    var node = this.node();
    var link = this.link();

    var nx = node.x();
    var ny = node.y();
    var nwidth = node.width();
    var nheight = node.height();
    var lcx = link.cx();
    var lcy = link.cy();

    var ncx = nx + nwidth / 2;
    var ncy = ny + nheight / 2;

    var alpha = Math.atan2(lcy - ncy, lcx - ncx);
    var beta = Math.PI / 2 - alpha;
    var t = Math.atan2(nheight, nwidth);

    var x, y;

    // left edge
    if (alpha < t - Math.PI || alpha > Math.PI - t) {
      x = nx;
      y = ncy - nwidth * Math.tan(alpha) / 2;
    }
    // top edge
    else if (alpha < -t) {
      x = ncx - nheight * Math.tan(beta) / 2;
      y = ny;
    }
    // right edge
    else if (alpha < t) {
      x = nx + nwidth;
      y = ncy + nwidth * Math.tan(alpha) / 2;
    }
    // bottom edge
    else {
      x = ncx + nheight * Math.tan(beta) / 2;
      y = ny + nheight;
    }

    var x0, y0, l, ex, ey;
    var r = 4;
    var atCorner = false;

    // top-left corner
    if (x < nx + r && y < ny + r) {
      x0 = nx + r;
      y0 = ny + r;
      atCorner = true;
    }
    // top-right corner
    else if (x > nx + nwidth - r && y < ny + r) {
      x0 = nx + nwidth - r;
      y0 = ny + r;
      atCorner = true;
    }
    // bottom-left corner
    else if (x < nx + r && y > ny + nheight - r) {
      x0 = nx + r;
      y0 = ny + nheight - r;
      atCorner = true;
    }
    // bottom-right corner
    else if (x > nx + nwidth - r && y > ny + nheight - r) {
      x0 = nx + nwidth - r;
      y0 = ny + nheight - r;
      atCorner = true;
    }

    if (atCorner) {
      l = Math.sqrt((x0 - x) * (x0 - x) + (y0 - y) * (y0 - y));
      ex = (x0 - x) / l;
      ey = (y0 - y) / l;
      x = x0 - r * ex;
      y = y0 - r * ey;
    }

    return {
      x: x,
      y: y
    };
  };

  Connection.TYPE_UNDEFINED = 'undefined';
  Connection.TYPE_SOURCE = 'source';
  Connection.TYPE_TARGET = 'target';

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

  Cmap.prototype.connect = function(type, node, link) {
    if (!node || !link)
      return;

    var connection = new Connection({
      type: type,
      node: node,
      link: link
    });

    node.relations().push(connection);
    link.relations().push(connection);

    // do not need to mark node dirty (stay unchanged)
    link.markDirty();
  };

  Cmap.prototype.disconnect = function(type, node, link) {
    if (!node || !link)
      return;

    // remove connection from node
    var nodeRelations = node.relations().filter(function(relation) {
      return relation.type() !== type || relation.link() !== link;
    });

    // remove connection from link
    var linkRelations = link.relations().filter(function(relation) {
      return relation.type() !== type || relation.node() !== node;
    });

    node.relations(nodeRelations);
    link.relations(linkRelations);

    // do not need to mark node dirty (stay unchanged)
    link.markDirty();
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

      this.componentList().each(function(component) {
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