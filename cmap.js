(function(global) {
  'use strict';

  var helper = {};

  helper.toNumber = function(value, defaultValue) {
    return !isNaN(value) ? +value : defaultValue;
  };

  helper.toString = function(value, defaultValue) {
    return (typeof value !== 'undefined') ? '' + value : defaultValue;
  };

  helper.toBoolean = function(value, defaultValue) {
    return (typeof value !== 'undefined') ? !!value : defaultValue;
  };

  helper.toContentType = function(value, defaultValue) {
    if (value === helper.CONTENT_TYPE_TEXT || value === helper.CONTENT_TYPE_HTML)
      return value;

    return defaultValue;
  };

  helper.isPlainObject = function(obj) {
    return (typeof obj === 'object' && obj !== null &&
            Object.prototype.toString.call(obj) === '[object Object]');
  };

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

  helper.wrap = (function() {
    var Wrapper = function(obj, key) {
      this.obj = obj;
      this.key = key;

      var wrapper = this.unwrap.bind(this);
      var proto = Object.getPrototypeOf(obj);

      for (var key in proto) {
        wrapper[key] = this.chain(proto[key], obj);
      }

      return wrapper;
    };

    Wrapper.prototype.unwrap = function(key) {
      if (this.key === key)
        return this.obj;
    };

    Wrapper.prototype.chain = function(func, ctx) {
      return function() {
        var ret = func.apply(ctx, arguments);

        if (typeof ret === 'undefined')
          return this;

        return ret;
      };
    };

    return function(obj, key) {
      return new Wrapper(obj, key);
    };
  })();

  helper.deactivate = function(obj) {
    for (var key in obj) {
      delete obj[key];
    }
  };

  helper.eachInstance = function(array, ctor, callback) {
    array.filter(function(obj) {
      return obj instanceof ctor;
    }).forEach(callback);
  };

  helper.firstInstance = function(array, ctor) {
    return array.filter(function(obj) {
      return obj instanceof ctor;
    })[0];
  };

  helper.diffObj = function(newObj, oldObj) {
    var diff = {};

    for (var key in newObj) {
      if (!oldObj || newObj[key] !== oldObj[key])
        diff[key] = newObj[key];
    }

    return diff;
  };

  helper.pick = function(obj, keys) {
    var ret = {};

    if (!obj)
      return ret;

    keys.forEach(function(key) {
      if (key in obj)
        ret[key] = obj[key];
    });

    return ret;
  };

  helper.identity = function(value) {
    return value;
  };

  helper.List = (function() {
    var List = function() {
      this.data = [];
    };

    List.prototype.add = function(item) {
      if (!this.contains(item))
        this.data.push(item);
    };

    List.prototype.remove = function(item) {
      var data = this.data;

      for (var i = data.length - 1; i >= 0; i--) {
        if (this.equal(data[i], item)) {
          data.splice(i, 1);
          break;
        }
      }
    };

    List.prototype.contains = function(item) {
      return this.data.some(function(dataItem) {
        return this.equal(dataItem, item);
      }.bind(this));
    };

    List.prototype.equal = function(a, b) {
      return a === b;
    };

    List.prototype.toArray = function() {
      return this.data.slice();
    };

    return List;
  })();

  helper.CONTENT_TYPE_TEXT = 'text';
  helper.CONTENT_TYPE_HTML = 'html';

  var dom = {};

  dom.disabled = function() {
    return (typeof document === 'undefined');
  };

  dom.el = function(selector) {
    if (selector.charAt(0) === '<') {
      selector = selector.match(/<(.+)>/)[1];
      return document.createElement(selector);
    }
  };

  dom.body = function() {
    return document.body;
  };

  dom.attr = function(el, props) {
    for (var key in props) {
      el.setAttribute(key, props[key]);
    }
  };

  dom.css = function(el, props) {
    var style = el.style;

    for (var key in props) {
      style[key] = props[key];
    }
  };

  dom.rect = function(el) {
    return el.getBoundingClientRect();
  };

  dom.clientWidth = function(el) {
    return el.clientWidth;
  };

  dom.clientHeight = function(el) {
    return el.clientHeight;
  };

  dom.scrollLeft = function(el) {
    return el.scrollLeft;
  };

  dom.scrollTop = function(el) {
    return el.scrollTop;
  };

  dom.scrollWidth = function(el) {
    return el.scrollWidth;
  };

  dom.scrollHeight = function(el) {
    return el.scrollHeight;
  };

  dom.text = function(el, s) {
    el.textContent = s;
  };

  dom.html = function(el, s) {
    el.innerHTML = s;
  };

  dom.append = function(parent, el) {
    parent.appendChild(el);
  };

  dom.remove = function(el) {
    el.parentNode.removeChild(el);
  };

  dom.child = function(el, index) {
    return el.childNodes[index];
  };

  dom.animate = function(callback) {
    return window.requestAnimationFrame(callback);
  };

  dom.supportsTouch = function() {
    return 'createTouch' in document;
  };

  dom.on = function(el, type, listener) {
    el.addEventListener(type, listener);
  };

  dom.off = function(el, type, listener) {
    el.removeEventListener(type, listener);
  };

  dom.pagePoint = function(event, offset) {
    if (dom.supportsTouch())
      event = event.changedTouches[0];

    return {
      x: event.pageX - (offset ? offset.x : 0),
      y: event.pageY - (offset ? offset.y : 0)
    };
  };

  dom.clientPoint = function(event, offset) {
    if (dom.supportsTouch())
      event = event.changedTouches[0];

    return {
      x: event.clientX - (offset ? offset.x : 0),
      y: event.clientY - (offset ? offset.y : 0)
    };
  };

  dom.cancel = function(event) {
    event.preventDefault();
  };

  dom.draggable = function(el, onstart, onmove, onend) {
    new Draggable({
      el: el,
      onstart: onstart,
      onmove: onmove,
      onend: onend
    });
  };

  // define event types for mouse/touch events
  (function() {
    if (dom.disabled())
      return;

    var supportsTouch = dom.supportsTouch();

    dom.EVENT_TYPE_START = supportsTouch ? 'touchstart' : 'mousedown';
    dom.EVENT_TYPE_MOVE = supportsTouch ? 'touchmove' : 'mousemove';
    dom.EVENT_TYPE_END = supportsTouch ? 'touchend' : 'mouseup';
  })();

  var Draggable = function(props) {
    this.el = props.el;
    this.onstart = props.onstart;
    this.onmove = props.onmove;
    this.onend = props.onend;
    this.start = Draggable.start.bind(this);
    this.move = Draggable.move.bind(this);
    this.end = Draggable.end.bind(this);
    this.lock = false;
    this.startingPoint = null;

    dom.on(this.el, dom.EVENT_TYPE_START, this.start);
  };

  Draggable.start = function(event) {
    if (this.lock)
      return;

    this.lock = true;
    this.startingPoint = dom.pagePoint(event);

    var el = this.el;
    var onstart = this.onstart;

    var rect = dom.rect(el);
    var p = dom.clientPoint(event, {
      x: rect.left - dom.scrollLeft(el),
      y: rect.top - dom.scrollTop(el)
    });

    if (typeof onstart === 'function')
      onstart(p.x, p.y, event);

    dom.on(document, dom.EVENT_TYPE_MOVE, this.move);
    dom.on(document, dom.EVENT_TYPE_END, this.end);
  };

  Draggable.move = function(event) {
    var onmove = this.onmove;
    var d = dom.pagePoint(event, this.startingPoint);

    if (typeof onmove === 'function')
      onmove(d.x, d.y, event);
  };

  Draggable.end = function(event) {
    dom.off(document, dom.EVENT_TYPE_MOVE, this.move);
    dom.off(document, dom.EVENT_TYPE_END, this.end);

    var onend = this.onend;
    var d = dom.pagePoint(event, this.startingPoint);

    if (typeof onend === 'function')
      onend(d.x, d.y, event);

    this.lock = false;
  };

  var Component = function() {};

  Component.prototype.prop = function(initialValue, defaultValue, converter) {
    if (typeof converter !== 'function')
      converter = helper.identity;

    var cache = converter(initialValue, defaultValue);

    return function(value) {
      if (typeof value === 'undefined')
        return cache;

      if (value === cache)
        return;

      cache = converter(value, cache);

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

    var updateRelations = function(index) {
      for (var i = index, len = dirtyComponents.length; i < len; i++) {
        var component = dirtyComponents[i];
        component.relations().forEach(function(relation) {
          relation.update(component);
        });
      }

      // may be inserted other dirty components by updating relations
      if (dirtyComponents.length > len)
        updateRelations(len);
    };

    var callback = function() {
      updateRelations(0);

      dirtyComponents.forEach(function(component) {
        component.redraw();
      });

      dirtyComponents = [];
      requestId = null;
    };

    return function() {
      if (dom.disabled())
        return;

      if (dirtyComponents.indexOf(this) === -1)
        dirtyComponents.push(this);

      if (requestId !== null)
        return;

      requestId = dom.animate(callback);
    };
  })();

  var Node = helper.inherits(function(props) {
    this.content = this.prop(props.content, '', helper.toString);
    this.contentType = this.prop(props.contentType, helper.CONTENT_TYPE_TEXT, helper.toContentType);
    this.x = this.prop(props.x, 0, helper.toNumber);
    this.y = this.prop(props.y, 0, helper.toNumber);
    this.width = this.prop(props.width, 75, helper.toNumber);
    this.height = this.prop(props.height, 30, helper.toNumber);
    this.backgroundColor = this.prop(props.backgroundColor, '#a7cbe6', helper.toString);
    this.borderColor = this.prop(props.borderColor, '#333', helper.toString);
    this.borderWidth = this.prop(props.borderWidth, 2, helper.toNumber);
    this.textColor = this.prop(props.textColor, '#333', helper.toString);
    this.zIndex = this.prop('auto');
    this.element = this.prop(null);
    this.parentElement = this.prop(null);
    this.cache = this.prop({});
    this.relations = this.prop([]);
  }, Component);

  Node.prototype.cx = function() {
    return this.x() + this.width() / 2;
  };

  Node.prototype.cy = function() {
    return this.y() + this.height() / 2;
  };

  Node.prototype.borderRadius = function() {
    return 4;
  };

  Node.prototype.contains = function(x, y, tolerance) {
    var nx = this.x();
    var ny = this.y();
    var nwidth = this.width();
    var nheight = this.height();

    return (nx - tolerance <= x && x <= nx + nwidth + tolerance &&
            ny - tolerance <= y && y <= ny + nheight + tolerance);
  };

  Node.prototype.style = function() {
    var contentType = this.contentType();
    var lineHeight = (contentType === helper.CONTENT_TYPE_TEXT) ? this.height() : 14;
    var textAlign = (contentType === helper.CONTENT_TYPE_TEXT) ? 'center' : 'left';
    var translate = 'translate(' + this.x() + 'px, ' + this.y() + 'px)';
    var borderWidthOffset = this.borderWidth() * 2;

    return {
      backgroundColor: this.backgroundColor(),
      border: this.borderWidth() + 'px solid ' + this.borderColor(),
      borderRadius: this.borderRadius() + 'px',
      color: this.textColor(),
      height: (this.height() - borderWidthOffset) + 'px',
      lineHeight: (lineHeight - borderWidthOffset) + 'px',
      msTransform: translate,
      overflow: 'hidden',
      pointerEvents: 'none',
      position: 'absolute',
      textAlign: textAlign,
      textOverflow: 'ellipsis',
      transform: translate,
      webkitTransform: translate,
      whiteSpace: 'nowrap',
      width: (this.width() - borderWidthOffset) + 'px',
      zIndex: this.zIndex()
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

    // update element
    var content = this.content();

    if (content !== cache.content) {
      var contentType = this.contentType();

      if (contentType === helper.CONTENT_TYPE_TEXT)
        dom.text(element, content);
      else if (contentType === helper.CONTENT_TYPE_HTML)
        dom.html(element, content);

      cache.content = content;
    }

    var style = this.style();

    dom.css(element, helper.diffObj(style, cache.style));
    cache.style = style;
  };

  var Link = helper.inherits(function(props) {
    this.content = this.prop(props.content, '', helper.toString);
    this.contentType = this.prop(props.contentType, helper.CONTENT_TYPE_TEXT, helper.toContentType);
    this.cx = this.prop(props.cx, 100, helper.toNumber);
    this.cy = this.prop(props.cy, 40, helper.toNumber);
    this.width = this.prop(props.width, 50, helper.toNumber);
    this.height = this.prop(props.height, 20, helper.toNumber);
    this.backgroundColor = this.prop(props.backgroundColor, 'white', helper.toString);
    this.borderColor = this.prop(props.borderColor, '#333', helper.toString);
    this.borderWidth = this.prop(props.borderWidth, 2, helper.toNumber);
    this.textColor = this.prop(props.textColor, '#333', helper.toString);
    this.sourceX = this.prop(props.sourceX, this.cx() - 70, helper.toNumber);
    this.sourceY = this.prop(props.sourceY, this.cy(), helper.toNumber);
    this.targetX = this.prop(props.targetX, this.cx() + 70, helper.toNumber);
    this.targetY = this.prop(props.targetY, this.cy(), helper.toNumber);
    this.lineColor = this.prop(props.lineColor, '#333', helper.toString);
    this.lineWidth = this.prop(props.lineWidth, 2, helper.toNumber);
    this.hasArrow = this.prop(props.hasArrow, true, helper.toBoolean);
    this.zIndex = this.prop('auto');
    this.element = this.prop(null);
    this.parentElement = this.prop(null);
    this.cache = this.prop({});
    this.relations = this.prop([]);
  }, Component);

  Link.prototype.straighten = function(sx, sy, tx, ty) {
    if (arguments.length === 0) {
      this.cx((this.sourceX() + this.targetX()) / 2);
      this.cy((this.sourceY() + this.targetY()) / 2);

      return;
    }

    this.cx((sx + tx) / 2);
    this.cy((sy + ty) / 2);
    this.sourceX(sx);
    this.sourceY(sy);
    this.targetX(tx);
    this.targetY(ty);
  };

  Link.prototype.contains = function(x, y, tolerance) {
    var content = this.content();
    var lcx = this.cx();
    var lcy = this.cy();

    // content area
    if (content) {
      var lwidth = this.width();
      var lheight = this.height();

      var lx = lcx - lwidth / 2;
      var ly = lcy - lheight / 2;

      if (lx - tolerance <= x && x <= lx + lwidth + tolerance &&
          ly - tolerance <= y && y <= ly + lheight + tolerance) {
        return true;
      }
    }

    var lineWidth = this.lineWidth();

    // source path
    if (this.containsPath(this.sourceX(), this.sourceY(), lcx, lcy, x, y, lineWidth / 2 + tolerance))
      return true;

    // target path
    if (this.containsPath(this.targetX(), this.targetY(), lcx, lcy, x, y, lineWidth / 2 + tolerance))
      return true;

    return false;
  };

  Link.prototype.containsPath = function(x0, y0, x1, y1, x, y, d) {
    var ax = x1 - x0;
    var ay = y1 - y0;

    var bx = x - x0;
    var by = y - y0;

    var r = (ax * bx + ay * by) / (ax * ax + ay * ay);

    if (0 <= r && r <= 1) {
      var px = x0 + r * ax;
      var py = y0 + r * ay;

      var dx = px - x;
      var dy = py - y;

      if (dx * dx + dy * dy <= d * d)
        return true;
    }

    return false;
  };

  Link.prototype.style = function() {
    return {
      pointerEvents: 'none',
      position: 'absolute',
      zIndex: this.zIndex()
    };
  };

  Link.prototype.pathContainerStyle = function() {
    var width = Math.max(this.cx(), this.sourceX(), this.targetX());
    var height = Math.max(this.cy(), this.sourceY(), this.targetY());

    return {
      height: height + 'px',
      overflow: 'visible',
      position: 'absolute',
      width: width + 'px'
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
    var lineHeight = (contentType === helper.CONTENT_TYPE_TEXT) ? this.height() : 14;
    var textAlign = (contentType === helper.CONTENT_TYPE_TEXT) ? 'center' : 'left';
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
      msTransform: translate,
      overflow: 'hidden',
      position: 'absolute',
      textAlign: textAlign,
      textOverflow: 'ellipsis',
      transform: translate,
      visibility: this.content() ? 'visible' : 'hidden',
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
      dom.html(element, '<svg><path></path><path></path></svg><div></div>');
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

    // update path container element
    var pathContainerStyle = this.pathContainerStyle();
    var pathContainerElement = dom.child(element, 0);

    dom.css(pathContainerElement, helper.diffObj(pathContainerStyle, cache.pathContainerElementStyle));
    cache.pathContainerElementStyle = contentStyle;

    // update line element
    var lineAttributes = this.lineAttributes();
    var lineElement = dom.child(pathContainerElement, 0);

    dom.attr(lineElement, helper.diffObj(lineAttributes, cache.lineAttributes));
    cache.lineAttributes = lineAttributes;

    // update arrow element
    var arrowAttributes = this.arrowAttributes();
    var arrowElement = dom.child(pathContainerElement, 1);

    dom.attr(arrowElement, helper.diffObj(arrowAttributes, cache.arrowAttributes));
    cache.arrowAttributes = arrowAttributes;

    // update content element
    var content = this.content();
    var contentStyle = this.contentStyle();
    var contentElement = dom.child(element, 1);

    if (content !== cache.content) {
      var contentType = this.contentType();

      if (contentType === helper.CONTENT_TYPE_TEXT)
        dom.text(contentElement, content);
      else if (contentType === helper.CONTENT_TYPE_HTML)
        dom.html(contentElement, content);

      cache.content = content;
    }

    dom.css(contentElement, helper.diffObj(contentStyle, cache.contentStyle));
    cache.contentStyle = contentStyle;

    // update container element
    var style = this.style();

    dom.css(element, helper.diffObj(style, cache.style));
    cache.style = style;
  };

  var Connector = helper.inherits(function(props) {
    this.x = this.prop(helper.toNumber(props.x, 0));
    this.y = this.prop(helper.toNumber(props.y, 0));
    this.color = this.prop(Connector.COLOR_UNCONNECTED);
    this.zIndex = this.prop('auto');
    this.element = this.prop(null);
    this.parentElement = this.prop(null);
    this.cache = this.prop({});
    this.relations = this.prop([]);
  }, Component);

  Connector.prototype.r = function() {
    return 16;
  };

  Connector.prototype.contains = function(x, y, tolerance) {
    var dx = x - this.x();
    var dy = y - this.y();
    var r = this.r() + tolerance;

    return (dx * dx + dy * dy <= r * r);
  };

  Connector.prototype.style = function() {
    var r = this.r();
    var x = this.x() - r;
    var y = this.y() - r;
    var translate = 'translate(' + x + 'px, ' + y + 'px)';

    return {
      backgroundColor: this.color(),
      border: '2px solid lightgray',
      borderRadius: '50%',
      boxSizing: 'border-box',
      height: r * 2 + 'px',
      msTransform: translate,
      opacity: 0.6,
      pointerEvents: 'none',
      position: 'absolute',
      transform: translate,
      webkitTransform: translate,
      width: r * 2 + 'px',
      zIndex: this.zIndex()
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

    var cache = this.cache();

    // update element
    var style = this.style();

    dom.css(element, helper.diffObj(style, cache.style));
    cache.style = style;
  };

  Connector.COLOR_CONNECTED = 'lightgreen';
  Connector.COLOR_UNCONNECTED = 'pink';

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

  var Triple = helper.inherits(function(props) {
    this.link = this.prop(props.link);
    this.sourceNode = this.prop(props.sourceNode || null);
    this.targetNode = this.prop(props.targetNode || null);
    this.skipNextUpdate = this.prop(false);
    this.nodePositionsCache = this.prop({});
  }, Relation);

  Triple.prototype.update = function(changedComponent) {
    if (this.skipNextUpdate()) {
      this.skipNextUpdate(false);
      return;
    }

    var link = this.link();
    var sourceNode = this.sourceNode();
    var targetNode = this.targetNode();

    if (changedComponent instanceof Node)
      this.updateNode(link, sourceNode, targetNode, changedComponent);
    else if (changedComponent instanceof Link)
      this.updateLink(link, sourceNode, targetNode);
  };

  Triple.prototype.updateNode = function(link, sourceNode, targetNode, changedNode) {
    if (sourceNode && targetNode)
      this.rotateLink(link, sourceNode, targetNode, changedNode);
    else
      this.shiftLink(link, sourceNode, targetNode, changedNode);

    this.updateNodePositionsCache();
  };

  Triple.prototype.rotateLink = function(link, sourceNode, targetNode, changedNode) {
    var cache = this.nodePositionsCache();

    var sncx = cache.sncx;
    var sncy = cache.sncy;
    var tncx = cache.tncx;
    var tncy = cache.tncy;

    var lcx = link.cx();
    var lcy = link.cy();

    var ts_dx = tncx - sncx;
    var ts_dy = tncy - sncy;
    var cs_dx = lcx - sncx;
    var cs_dy = lcy - sncy;

    var ts_rad0 = Math.atan2(ts_dy, ts_dx);
    var cs_rad0 = Math.atan2(cs_dy, cs_dx);

    // changed node position
    if (changedNode === sourceNode) {
      sncx = sourceNode.cx();
      sncy = sourceNode.cy();
    } else if (changedNode === targetNode) {
      tncx = targetNode.cx();
      tncy = targetNode.cy();
    }

    // center positions of two nodes are equal
    if (cs_rad0 === 0) {
      link.cx((sncx + tncx) / 2);
      link.cy((sncy + tncy) / 2);

      return;
    }

    var ts_d0 = Math.sqrt(ts_dx * ts_dx + ts_dy * ts_dy);
    var cs_d0 = Math.sqrt(cs_dx * cs_dx + cs_dy * cs_dy);

    var ts_cs_rad = ts_rad0 - cs_rad0;

    ts_dx = tncx - sncx;
    ts_dy = tncy - sncy;

    var ts_rad1 = Math.atan2(ts_dy, ts_dx);
    var cs_rad1 = ts_rad1 - ts_cs_rad;

    var ts_d1 = Math.sqrt(ts_dx * ts_dx + ts_dy * ts_dy);
    var d_rate = (ts_d0 !== 0) ? ts_d1 / ts_d0 : 1;
    var cs_d1 = cs_d0 * d_rate;

    lcx = sncx + cs_d1 * Math.cos(cs_rad1);
    lcy = sncy + cs_d1 * Math.sin(cs_rad1);

    link.cx(lcx);
    link.cy(lcy);
  };

  Triple.prototype.shiftLink = function(link, sourceNode, targetNode, changedNode) {
    var cache = this.nodePositionsCache();

    var ncx = changedNode.cx();
    var ncy = changedNode.cy();

    if (changedNode === sourceNode) {
      link.targetX(link.targetX() + (ncx - cache.sncx));
      link.targetY(link.targetY() + (ncy - cache.sncy));
    } else if (changedNode === targetNode) {
      link.sourceX(link.sourceX() + (ncx - cache.tncx));
      link.sourceY(link.sourceY() + (ncy - cache.tncy));
    }
  };

  Triple.prototype.updateLink = function(link, sourceNode, targetNode) {
    var lx, ly, p;

    if (sourceNode) {
      // connect link to source node
      lx = targetNode ? link.cx() : link.targetX();
      ly = targetNode ? link.cy() : link.targetY();
      p = this.connectedPoint(sourceNode, lx, ly);
      link.sourceX(p.x);
      link.sourceY(p.y);
    }

    if (targetNode) {
      // connect link to target node
      lx = sourceNode ? link.cx() : link.sourceX();
      ly = sourceNode ? link.cy() : link.sourceY();
      p = this.connectedPoint(targetNode, lx, ly);
      link.targetX(p.x);
      link.targetY(p.y);
    }

    if (!sourceNode || !targetNode) {
      // link content moves to midpoint
      link.cx((link.sourceX() + link.targetX()) / 2);
      link.cy((link.sourceY() + link.targetY()) / 2);
    }
  };

  Triple.prototype.updateLinkAngle = function(radians) {
    var link = this.link();
    var sourceNode = this.sourceNode();
    var targetNode = this.targetNode();

    var ldx = link.targetX() - link.sourceX();
    var ldy = link.targetY() - link.sourceY();
    var d = Math.sqrt(ldx * ldx + ldy * ldy);

    var connectedNode = sourceNode || targetNode;
    var cx = connectedNode.cx();
    var cy = connectedNode.cy();
    var lx = cx + d * Math.cos(radians);
    var ly = cy + d * Math.sin(radians);
    var p = this.connectedPoint(connectedNode, lx, ly);

    if (connectedNode === sourceNode)
      link.straighten(p.x, p.y, lx + p.x - cx, ly + p.y - cy);
    else if (connectedNode === targetNode)
      link.straighten(lx + p.x - cx, ly + p.y - cy, p.x, p.y);
  };

  Triple.prototype.updateNodePositionsCache = function() {
    var sourceNode = this.sourceNode();
    var targetNode = this.targetNode();
    var cache = this.nodePositionsCache();

    if (sourceNode) {
      cache.sncx = sourceNode.cx();
      cache.sncy = sourceNode.cy();
    }

    if (targetNode) {
      cache.tncx = targetNode.cx();
      cache.tncy = targetNode.cy();
    }
  };

  Triple.prototype.connectedPoint = function(node, lx, ly) {
    var nx = node.x();
    var ny = node.y();
    var nwidth = node.width();
    var nheight = node.height();
    var ncx = node.cx();
    var ncy = node.cy();

    var alpha = Math.atan2(ly - ncy, lx - ncx);
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
    var r = node.borderRadius();
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

  var LinkConnectorRelation = helper.inherits(function(props) {
    this.type = this.prop(props.type);
    this.link = this.prop(props.link);
    this.connector = this.prop(props.connector);
  }, Relation);

  LinkConnectorRelation.prototype.isConnected = function(isConnected) {
    var color = isConnected ? Connector.COLOR_CONNECTED : Connector.COLOR_UNCONNECTED;
    this.connector().color(color);
  };

  LinkConnectorRelation.prototype.update = function(changedComponent) {
    var type = this.type();
    var link = this.link();
    var connector = this.connector();

    if (changedComponent === link) {
      connector.x(link[type + 'X']());
      connector.y(link[type + 'Y']());
    }
  };

  var ComponentList = helper.inherits(function() {
    ComponentList.super_.call(this);
  }, helper.List);

  ComponentList.prototype.toFront = function(component) {
    var data = this.data;
    var index = data.indexOf(component);

    if (index === -1)
      return;

    data.splice(index, 1);
    data.push(component);
  };

  ComponentList.prototype.fromPoint = function(ctor, x, y) {
    var data = this.data;
    var closeComponent = null;

    for (var i = data.length - 1; i >= 0; i--) {
      var component = data[i];

      if (!(component instanceof ctor))
        continue;

      if (component.contains(x, y, 0))
        return component;

      if (!closeComponent && component.contains(x, y, 8))
        closeComponent = component;
    }

    return closeComponent;
  };

  var DisabledConnectorList = helper.inherits(function() {
    DisabledConnectorList.super_.call(this);
  }, helper.List);

  DisabledConnectorList.prototype.add = function(type, link) {
    DisabledConnectorList.super_.prototype.add.call(this, {
      type: type,
      link: link
    });
  };

  DisabledConnectorList.prototype.remove = function(type, link) {
    DisabledConnectorList.super_.prototype.remove.call(this, {
      type: type,
      link: link
    });
  };

  DisabledConnectorList.prototype.contains = function(type, link) {
    return DisabledConnectorList.super_.prototype.contains.call(this, {
      type: type,
      link: link
    });
  };

  DisabledConnectorList.prototype.equal = function(a, b) {
    return a.type === b.type && a.link === b.link;
  };

  var Cmap = helper.inherits(function(rootElement) {
    this.componentList = this.prop(new ComponentList());
    this.disabledConnectorList = this.prop(new DisabledConnectorList());
    this.dragDisabledComponentList = this.prop(new ComponentList());
    this.element = this.prop(null);
    this.rootElement = this.prop(rootElement || null);
    this.retainerElement = this.prop(null);
    this.dragContext = this.prop({});

    this.markDirty();
  }, Component);

  Cmap.prototype.add = function(component) {
    component.parentElement(this.element());
    this.componentList().add(component);
    this.updateZIndex();
  };

  Cmap.prototype.remove = function(component) {
    component.parentElement(null);

    if (component instanceof Link)
      this.hideConnectors(component);

    this.disconnect(component);
    this.componentList().remove(component);
    this.updateZIndex();
  };

  Cmap.prototype.toFront = function(component) {
    this.componentList().toFront(component);
    this.updateZIndex();
  };

  Cmap.prototype.updateZIndex = function() {
    this.componentList().toArray().forEach(function(component, index) {
      if (component instanceof Connector)
        return;

      // update z-index of node/link
      var zIndex = index * 10;
      component.zIndex(zIndex);

      if (!(component instanceof Link))
        return;

      // update connector z-index of link
      helper.eachInstance(component.relations(), LinkConnectorRelation, function(relation, index) {
        relation.connector().zIndex(zIndex + index + 1);
      });
    });
  };

  Cmap.prototype.connect = function(type, node, link) {
    var linkRelations = link.relations();
    var triple = helper.firstInstance(linkRelations, Triple);
    var nodeKey = type + 'Node';

    if (triple && triple[nodeKey]())
      throw new Error('Already connected');

    var anotherType = Cmap.anotherConnectionType(type);
    var anotherSideNode = triple ? triple[anotherType + 'Node']() : null;

    if (anotherSideNode === node)
      throw new Error('Already connected to the ' + anotherType + ' of the link');

    if (triple) {
      triple[nodeKey](node);
    } else {
      var tripleProps = {};
      tripleProps.link = link;
      tripleProps[nodeKey] = node;
      triple = new Triple(tripleProps);

      // add triple to the beginning of link relations to be ahead of link-connector relation
      // connector position won't be updated before triple update
      linkRelations.unshift(triple);
    }

    // add triple to node
    node.relations().push(triple);
    triple.updateNodePositionsCache();

    // update connectors of link
    helper.eachInstance(linkRelations, LinkConnectorRelation, function(relation) {
      if (relation.type() === type)
        relation.isConnected(true);
    });

    // link content moves to midpoint of connected nodes
    if (anotherSideNode) {
      link.cx((node.cx() + anotherSideNode.cx()) / 2);
      link.cy((node.cy() + anotherSideNode.cy()) / 2);
    }

    // do not need to mark node dirty (stay unchanged)
    link.markDirty();
  };

  Cmap.prototype.disconnect = function(type, node, link) {
    if (type instanceof Component) {
      var component = type;
      var relations = component.relations().slice();

      // disconnect all connections of component
      helper.eachInstance(relations, Triple, function(triple) {
        var link = triple.link();
        var sourceNode = triple.sourceNode();
        var targetNode = triple.targetNode();

        if (sourceNode && (component === link || component === sourceNode))
          this.disconnect(Cmap.CONNECTION_TYPE_SOURCE, sourceNode, link);

        if (targetNode && (component === link || component === targetNode))
          this.disconnect(Cmap.CONNECTION_TYPE_TARGET, targetNode, link);
      }.bind(this));

      return;
    }

    var linkRelations = link.relations();
    var triple = helper.firstInstance(linkRelations, Triple);
    var nodeKey = type + 'Node';

    if (!triple || triple[nodeKey]() !== node)
      throw new Error('Not connected');

    triple[nodeKey](null);

    // remove triple from node
    var nodeRelations = node.relations();
    nodeRelations.splice(nodeRelations.indexOf(triple), 1);

    // remove triple from link
    if (!triple.sourceNode() && !triple.targetNode())
      linkRelations.splice(linkRelations.indexOf(triple), 1);

    // update connectors of link
    helper.eachInstance(linkRelations, LinkConnectorRelation, function(relation) {
      if (relation.type() === type)
        relation.isConnected(false);
    });

    // do not need to mark node dirty (stay unchanged)
    link.markDirty();
  };

  Cmap.prototype.connectedNode = function(type, link) {
    var triple = helper.firstInstance(link.relations(), Triple);

    if (!triple)
      return null;

    return triple[type + 'Node']();
  };

  Cmap.prototype.showConnector = function(type, link) {
    if (this.connectorVisible(type, link))
      return;

    var disabledConnectorList = this.disabledConnectorList();
    var connectorDisabled = disabledConnectorList.contains(type, link);

    if (!connectorDisabled)
      this.addConnector(type, link);
  };

  Cmap.prototype.connectorVisible = function(type, link) {
    return link.relations().some(function(relation) {
      return relation instanceof LinkConnectorRelation && relation.type() === type;
    });
  };

  Cmap.prototype.addConnector = function(type, link) {
    var connector = new Connector({
      x: link[type + 'X'](),
      y: link[type + 'Y']()
    });

    var linkConnectorRelation = new LinkConnectorRelation({
      type: type,
      link: link,
      connector: connector
    });

    var linkRelations = link.relations();
    var triple = helper.firstInstance(linkRelations, Triple);
    var isConnected = (triple && !!triple[type + 'Node']());

    linkConnectorRelation.isConnected(isConnected);
    linkRelations.push(linkConnectorRelation);
    connector.relations().push(linkConnectorRelation);

    this.add(connector);
  };

  Cmap.prototype.hideConnector = function(type, link) {
    var linkRelations = link.relations();

    for (var i = linkRelations.length - 1; i >= 0; i--) {
      var relation = linkRelations[i];

      if (!(relation instanceof LinkConnectorRelation) || relation.type() !== type)
        continue;

      // remove connector component
      this.remove(relation.connector());

      // remove link-connector relation from link
      linkRelations.splice(i, 1);

      break;
    }
  };

  Cmap.prototype.showConnectors = function(link) {
    this.showConnector(Cmap.CONNECTION_TYPE_SOURCE, link);
    this.showConnector(Cmap.CONNECTION_TYPE_TARGET, link);
  };

  Cmap.prototype.hideConnectors = function(link) {
    this.hideConnector(Cmap.CONNECTION_TYPE_SOURCE, link);
    this.hideConnector(Cmap.CONNECTION_TYPE_TARGET, link);
  };

  Cmap.prototype.hideAllConnectors = function() {
    this.componentList().toArray().forEach(function(component) {
      if (component instanceof Link)
        this.hideConnectors(component);
    }.bind(this));
  };

  Cmap.prototype.enableConnector = function(type, link) {
    this.disabledConnectorList().remove(type, link);
  };

  Cmap.prototype.disableConnector = function(type, link) {
    // remove showing connector
    this.hideConnector(type, link);

    this.disabledConnectorList().add(type, link);
  };

  Cmap.prototype.connectorEnabled = function(type, link) {
    return !this.disabledConnectorList().contains(type, link);
  };

  Cmap.prototype.enableDrag = function(component) {
    this.dragDisabledComponentList().remove(component);
  };

  Cmap.prototype.disableDrag = function(component) {
    this.dragDisabledComponentList().add(component);
  };

  Cmap.prototype.dragEnabled = function(component) {
    return !this.dragDisabledComponentList().contains(component);
  };

  Cmap.prototype.onstart = function(x, y, event) {
    var context = this.dragContext();

    var component = this.componentList().fromPoint(Component, x, y);
    context.component = component;

    if (!(component instanceof Connector))
      this.hideAllConnectors();

    if (!component)
      return;

    var draggable = !this.dragDisabledComponentList().contains(component);
    context.draggable = draggable;

    if (!draggable)
      return;

    dom.cancel(event);

    this.toFront(component);

    if (component instanceof Node) {
      context.x = component.x();
      context.y = component.y();
    } else if (component instanceof Link) {
      context.cx = component.cx();
      context.cy = component.cy();
      context.sourceX = component.sourceX();
      context.sourceY = component.sourceY();
      context.targetX = component.targetX();
      context.targetY = component.targetY();
      context.triple = helper.firstInstance(component.relations(), Triple);

      this.showConnectors(component);
    } else if (component instanceof Connector) {
      var linkConnectorRelation = helper.firstInstance(component.relations(), LinkConnectorRelation);

      context.x = x;
      context.y = y;
      context.type = linkConnectorRelation.type();
      context.link = linkConnectorRelation.link();
    }

    this.fixScrollSize();
  };

  Cmap.prototype.onmove = function(dx, dy, event) {
    var context = this.dragContext();

    var component = context.component;

    if (!component)
      return;

    if (!context.draggable)
      return;

    if (component instanceof Node) {
      component.x(context.x + dx);
      component.y(context.y + dy);
    } else if (component instanceof Link) {
      var cx = context.cx + dx;
      var cy = context.cy + dy;
      var triple = context.triple;
      var connectedNode = null;

      if (triple) {
        var sourceNode = triple.sourceNode();
        var targetNode = triple.targetNode();

        if (sourceNode && !targetNode)
          connectedNode = sourceNode;
        else if (!sourceNode && targetNode)
          connectedNode = targetNode;
      }

      if (connectedNode) {
        // only one node connected
        var x = cx - connectedNode.cx();
        var y = cy - connectedNode.cy();
        triple.updateLinkAngle(Math.atan2(y, x));
        triple.skipNextUpdate(true);
      } else if (!triple || component.content()) {
        // not connected or link has content
        // (except two nodes connected but link has no content)
        component.cx(cx);
        component.cy(cy);
        component.sourceX(context.sourceX + dx);
        component.sourceY(context.sourceY + dy);
        component.targetX(context.targetX + dx);
        component.targetY(context.targetY + dy);
      }
    } else if (component instanceof Connector) {
      var x = context.x + dx;
      var y = context.y + dy;
      var type = context.type;
      var link = context.link;

      var triple = helper.firstInstance(link.relations(), Triple);
      var connectedNode = triple ? triple[type + 'Node']() : null;
      var node = this.componentList().fromPoint(Node, x, y);

      if (connectedNode && connectedNode === node) {
        // already connected (do nothing)
        return;
      }

      var anotherType = Cmap.anotherConnectionType(type);
      var anotherSideNode = triple ? triple[anotherType + 'Node']() : null;

      if (connectedNode && connectedNode !== node) {
        this.disconnect(type, connectedNode, link);
        connectedNode = null;
      }

      var needsConnect = !connectedNode && node && anotherSideNode !== node;

      if (needsConnect) {
        if (anotherSideNode) {
          var p = triple.connectedPoint(node, anotherSideNode.cx(), anotherSideNode.cy());

          link[type + 'X'](p.x);
          link[type + 'Y'](p.y);

          triple.update(link);
          triple.skipNextUpdate(true);
        }

        this.connect(type, node, link);
      } else {
        link[type + 'X'](x);
        link[type + 'Y'](y);

        if (!anotherSideNode)
          link.straighten();
      }
    }
  };

  Cmap.prototype.onend = function(dx, dy, event) {
    var context = this.dragContext();

    var component = context.component;

    if (!component)
      return;

    if (!context.draggable)
      return;

    this.unfixScrollSize();
  };

  Cmap.prototype.fixScrollSize = function() {
    var element = this.element();

    var clientWidth = dom.clientWidth(element);
    var clientHeight = dom.clientHeight(element);
    var scrollWidth = dom.scrollWidth(element);
    var scrollHeight = dom.scrollHeight(element);

    // check if scrolled
    if (clientWidth === scrollWidth && clientHeight === scrollHeight)
      return;

    var translate = 'translate(' + (scrollWidth - 1) + 'px, ' + (scrollHeight - 1) + 'px)';

    dom.css(this.retainerElement(), {
      msTransform: translate,
      transform: translate,
      webkitTransform: translate
    });
  };

  Cmap.prototype.unfixScrollSize = function() {
    var translate = 'translate(-1px, -1px)';

    dom.css(this.retainerElement(), {
      msTransform: translate,
      transform: translate,
      webkitTransform: translate
    });
  };

  Cmap.prototype.style = function() {
    return {
      color: '#333',
      cursor: 'default',
      fontFamily: 'sans-serif',
      fontSize: '14px',
      height: '100%',
      MozUserSelect: 'none',
      msUserSelect: 'none',
      overflow: 'auto',
      position: 'relative',
      userSelect: 'none',
      webkitUserSelect: 'none',
      width: '100%'
    };
  };

  Cmap.prototype.retainerStyle = function() {
    return {
      height: '1px',
      pointerEvents: 'none',
      position: 'absolute',
      width: '1px'
    };
  };

  Cmap.prototype.redraw = function() {
    var rootElement = this.rootElement();

    if (!rootElement) {
      rootElement = dom.body();
      this.rootElement(rootElement);
    }

    var element = dom.el('<div>');
    dom.draggable(element, this.onstart.bind(this), this.onmove.bind(this), this.onend.bind(this));
    this.element(element);

    this.componentList().toArray().forEach(function(component) {
      component.parentElement(element);
    });

    var retainerElement = dom.el('<div>');
    dom.css(retainerElement, this.retainerStyle());
    dom.append(element, retainerElement);
    this.retainerElement(retainerElement);

    // set initial position of retainer
    this.unfixScrollSize();

    dom.css(element, this.style());
    dom.append(rootElement, element);
  };

  Cmap.anotherConnectionType = function(type) {
    if (type === Cmap.CONNECTION_TYPE_SOURCE)
      return Cmap.CONNECTION_TYPE_TARGET;
    else if (type === Cmap.CONNECTION_TYPE_TARGET)
      return Cmap.CONNECTION_TYPE_SOURCE;
  };

  Cmap.CONNECTION_TYPE_SOURCE = 'source';
  Cmap.CONNECTION_TYPE_TARGET = 'target';

  var ComponentModule = function(component, cmap) {
    this.component = component;
    this.cmap = cmap;
    this.wrapper = helper.wrap(this, cmap.component);
  };

  ComponentModule.prototype.attr = function(key, value) {
    var component = this.component;
    var attributeKeys = this.constructor.attributeKeys();

    if (typeof key === 'undefined') {
      var props = {};

      attributeKeys.forEach(function(key) {
        props[key] = component[key]();
      });

      return props;
    }

    if (helper.isPlainObject(key)) {
      var props = key;

      for (key in props) {
        this.attr(key, props[key]);
      }

      return;
    }

    if (attributeKeys.indexOf(key) === -1)
      return;

    if (typeof value === 'undefined')
      return component[key]();

    component[key](value);
  };

  ComponentModule.prototype.remove = function() {
    this.cmap.component.remove(this.component);
    helper.deactivate(this.wrapper);

    this.component = null;
    this.cmap = null;
    this.wrapper = null;
  };

  ComponentModule.prototype.toFront = function() {
    this.cmap.component.toFront(this.component);
  };

  ComponentModule.prototype.element = function() {
    return this.component.element();
  };

  ComponentModule.prototype.redraw = function() {
    this.component.redraw();
  };

  ComponentModule.prototype.draggable = function(enabled) {
    var component = this.component;
    var cmap = this.cmap;

    if (typeof enabled === 'undefined')
      return cmap.component.dragEnabled(component);

    if (enabled)
      cmap.component.enableDrag(component);
    else
      cmap.component.disableDrag(component);
  };

  ComponentModule.attributeKeys = function() {
    return [];
  };

  var NodeModule = helper.inherits(function(props, cmap) {
    var component = new Node(helper.pick(props, NodeModule.attributeKeys()));

    NodeModule.super_.call(this, component, cmap);
  }, ComponentModule);

  NodeModule.prototype.remove = function() {
    this.cmap.nodeModuleList.remove(this);
    NodeModule.super_.prototype.remove.call(this);
  };

  NodeModule.attributeKeys = function() {
    return [
      'content',
      'contentType',
      'x',
      'y',
      'width',
      'height',
      'backgroundColor',
      'borderColor',
      'borderWidth',
      'textColor'
    ];
  };

  var LinkModule = helper.inherits(function(props, cmap) {
    var component = new Link(helper.pick(props, LinkModule.attributeKeys()));

    LinkModule.super_.call(this, component, cmap);
  }, ComponentModule);

  LinkModule.prototype.sourceNode = function(node) {
    return LinkModule.connectNode(this, Cmap.CONNECTION_TYPE_SOURCE, node);
  };

  LinkModule.prototype.targetNode = function(node) {
    return LinkModule.connectNode(this, Cmap.CONNECTION_TYPE_TARGET, node);
  };

  LinkModule.prototype.sourceConnectorEnabled = function(enabled) {
    return LinkModule.connectorEnabled(this, Cmap.CONNECTION_TYPE_SOURCE, enabled);
  };

  LinkModule.prototype.targetConnectorEnabled = function(enabled) {
    return LinkModule.connectorEnabled(this, Cmap.CONNECTION_TYPE_TARGET, enabled);
  };

  LinkModule.attributeKeys = function() {
    return [
      'content',
      'contentType',
      'cx',
      'cy',
      'width',
      'height',
      'backgroundColor',
      'borderColor',
      'borderWidth',
      'textColor',
      'sourceX',
      'sourceY',
      'targetX',
      'targetY',
      'lineColor',
      'lineWidth',
      'hasArrow'
    ];
  };

  LinkModule.connectNode = function(module, type, node) {
    var component = module.component;
    var cmap = module.cmap;

    var cmapComponent = cmap.component;
    var connectedNodeComponent = cmapComponent.connectedNode(type, component);

    if (typeof node === 'undefined') {
      if (!connectedNodeComponent)
        return null;

      var connectedNode = cmap.nodeModuleList.fromComponent(connectedNodeComponent);
      return connectedNode.wrapper;
    }

    if (node !== null) {
      if (typeof node !== 'function')
        throw TypeError('Invalid node');

      // unwrap node module
      node = node(cmap.component);

      if (!(node instanceof NodeModule))
        throw TypeError('Invalid node');

      // cannot connect the same node to the source and the target of the link
      var anotherType = Cmap.anotherConnectionType(type);
      var anotherNodeComponent = cmapComponent.connectedNode(anotherType, component);

      if (anotherNodeComponent === node.component)
        return;
    }

    if (connectedNodeComponent)
      cmapComponent.disconnect(type, connectedNodeComponent, component);

    if (node === null)
      return;

    cmapComponent.connect(type, node.component, component);
  };

  LinkModule.connectorEnabled = function(module, type, enabled) {
    var component = module.component;
    var cmap = module.cmap;

    var cmapComponent = cmap.component;

    if (typeof enabled === 'undefined')
      return cmapComponent.connectorEnabled(type, component);

    if (enabled) {
      cmapComponent.enableConnector(type, component);

      // show the connector if another connector is showing
      var anotherType = Cmap.anotherConnectionType(type);

      if (cmapComponent.connectorVisible(anotherType, component))
        cmapComponent.showConnector(type, component);
    } else {
      cmapComponent.disableConnector(type, component);
    }
  };

  var NodeModuleList = helper.inherits(function() {
    NodeModuleList.super_.call(this);
  }, helper.List);

  NodeModuleList.prototype.fromComponent = function(component) {
    var data = this.data;

    for (var i = 0, len = data.length; i < len; i++) {
      var node = data[i];

      if (node.component === component)
        return node;
    }

    return null;
  };

  var CmapModule = function(element) {
    if (!(this instanceof CmapModule))
      return new CmapModule(element);

    this.component = new Cmap(element);
    this.nodeModuleList = new NodeModuleList();

    return helper.wrap(this, this.component);
  };

  CmapModule.prototype.node = function(props) {
    if (typeof props !== 'undefined' && !helper.isPlainObject(props))
      throw TypeError('Type error');

    var node = new NodeModule(props, this);

    this.component.add(node.component);
    this.nodeModuleList.add(node);

    return node.wrapper;
  };

  CmapModule.prototype.link = function(props) {
    if (typeof props !== 'undefined' && !helper.isPlainObject(props))
      throw TypeError('Type error');

    var link = new LinkModule(props, this);

    this.component.add(link.component);

    return link.wrapper;
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = CmapModule;
  else
    global.Cmap = CmapModule;
})(this);