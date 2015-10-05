(function(global) {
  'use strict';

  var helper = {};

  helper.toNumber = function(value, defaultValue) {
    return (typeof value === 'number') ? value : defaultValue;
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

  var Node = helper.inherits(function(props) {
    this.content = this.prop(props.content || '');
    this.contentType = this.prop(props.contentType || Node.CONTENT_TYPE_TEXT);
    this.x = this.prop(helper.toNumber(props.x, 0));
    this.y = this.prop(helper.toNumber(props.y, 0));
    this.width = this.prop(helper.toNumber(props.width, 75));
    this.height = this.prop(helper.toNumber(props.height, 30));
    this.backgroundColor = this.prop(props.backgroundColor || '#a7cbe6');
    this.borderColor = this.prop(props.borderColor || '#333');
    this.borderWidth = this.prop(helper.toNumber(props.borderWidth, 2));
    this.textColor = this.prop(props.textColor || '#333');
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

  var Link = helper.inherits(function(props) {
    this.content = this.prop(props.content || '');
    this.contentType = this.prop(props.contentType || Link.CONTENT_TYPE_TEXT);
    this.cx = this.prop(helper.toNumber(props.cx, 100));
    this.cy = this.prop(helper.toNumber(props.cy, 40));
    this.width = this.prop(helper.toNumber(props.width, 50));
    this.height = this.prop(helper.toNumber(props.height, 20));
    this.backgroundColor = this.prop(props.backgroundColor || 'white');
    this.borderColor = this.prop(props.borderColor || '#333');
    this.borderWidth = this.prop(helper.toNumber(props.borderWidth, 2));
    this.textColor = this.prop(props.textColor || '#333');
    this.sourceX = this.prop(props.sourceX || this.cx() - 70);
    this.sourceY = this.prop(props.sourceY || this.cy());
    this.targetX = this.prop(props.targetX || this.cx() + 70);
    this.targetY = this.prop(props.targetY || this.cy());
    this.lineColor = this.prop(props.lineColor || '#333');
    this.lineWidth = this.prop(helper.toNumber(props.lineWidth, 2));
    this.hasArrow = this.prop(!!props.hasArrow);
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

  var Connector = helper.inherits(function(props) {
    this.x = this.prop(helper.toNumber(props.x, 0));
    this.y = this.prop(helper.toNumber(props.y, 0));
    this.r = this.prop(helper.toNumber(props.r, 16));
    this.color = this.prop(props.color || Connector.COLOR_UNCONNECTED);
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

  var Triple = helper.inherits(function(props) {
    this.sourceNode = this.prop(props.sourceNode || null);
    this.link = this.prop(props.link || null);
    this.targetNode = this.prop(props.targetNode || null);
  }, Relation);

  Triple.prototype.update = function(changedComponent) {
    var sourceNode = this.sourceNode();
    var link = this.link();
    var targetNode = this.targetNode();

    if (changedComponent === link)
      this.updateLink(link, sourceNode, targetNode);
    else if (changedComponent === sourceNode)
      this.updateSourceNode(link, sourceNode, targetNode);
    else if (changedComponent === targetNode)
      this.updateTargetNode(link, sourceNode, targetNode);
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

  Triple.prototype.updateSourceNode = function(link, sourceNode, targetNode) {
    if (targetNode)
      this.rotateLink(link, sourceNode, targetNode, sourceNode);
    else
      this.shiftLink(link, sourceNode, targetNode);
  };

  Triple.prototype.updateTargetNode = function(link, sourceNode, targetNode) {
    if (sourceNode)
      this.rotateLink(link, sourceNode, targetNode, targetNode);
    else
      this.shiftLink(link, sourceNode, targetNode);
  };

  Triple.prototype.rotateLink = function(link, sourceNode, targetNode, changedNode) {
    var ncx = changedNode.cx();
    var ncy = changedNode.cy();
    var sncx = sourceNode.cx();
    var sncy = sourceNode.cy();
    var tncx = targetNode.cx();
    var tncy = targetNode.cy();
    var lcx = link.cx();
    var lcy = link.cy();
    var xs = sourceNode === changedNode ? link.sourceX() : sncx;
    var ys = sourceNode === changedNode ? link.sourceY() : sncy;
    var xt = targetNode === changedNode ? link.targetX() : tncx;
    var yt = targetNode === changedNode ? link.targetY() : tncy;
    if (sourceNode === changedNode) {
      var lx = lcx + ncx - xs;
      var ly = lcy + ncy - ys;
      var p = this.connectedPoint(changedNode, lx, ly);
      xs = xs + ncx - p.x;
      ys = ys + ncy - p.y;
    } else {
      var lx = lcx + ncx - xt;
      var ly = lcy + ncy - yt;
      var p = this.connectedPoint(changedNode, lx, ly);
      xt = xt + ncx - p.x;
      yt = yt + ncy - p.y;
    }
    var x_ts = xt - xs;
    var y_ts = yt - ys;
    var x_cs = link.cx() - xs;
    var y_cs = link.cy() - ys;
    var ts0 = Math.atan2(y_ts, x_ts);
    var cs0 = Math.atan2(y_cs, x_cs);
    var r_cs = cs0 - ts0;
    var d_ts0 = Math.sqrt(x_ts * x_ts + y_ts * y_ts);
    var d_cs0 = Math.sqrt(x_cs * x_cs + y_cs * y_cs);
    xs = sourceNode.cx();
    ys = sourceNode.cy();
    xt = targetNode.cx();
    yt = targetNode.cy();
    x_ts = xt - xs;
    y_ts = yt - ys;
    var ts1 = Math.atan2(y_ts, x_ts);
    var cs1 = ts1 + r_cs;
    var d_ts1 = Math.sqrt(x_ts * x_ts + y_ts * y_ts);
    var d_rate = (d_ts0 !== 0) ? d_ts1 / d_ts0 : 1.0;
    var d_cs = d_cs0 * d_rate;
    var cx = xs + d_cs * Math.cos(cs1);
    var cy = ys + d_cs * Math.sin(cs1);
    link.cx(cx);
    link.cy(cy);
    var sp = this.connectedPoint(sourceNode, cx, cy);
    link.sourceX(sp.x);
    link.sourceY(sp.y);
    var tp = this.connectedPoint(targetNode, cx, cy);
    link.targetX(tp.x);
    link.targetY(tp.y);
  };

  Triple.prototype.shiftLink = function(link, sourceNode, targetNode) {
    var node = sourceNode || targetNode;
    var ncx = node.cx();
    var ncy = node.cy();
    var lsx = link.sourceX();
    var lsy = link.sourceY();
    var ltx = link.targetX();
    var lty = link.targetY();
    var ldx = sourceNode ? lsx - ncx : ltx - ncx;
    var ldy = sourceNode ? lsy - ncy : lty - ncy;
    var lx = sourceNode ? ltx - ldx : lsx - ldx;
    var ly = sourceNode ? lty - ldy : lsy - ldy;
    var p = this.connectedPoint(node, lx, ly);
    var dx = sourceNode ? p.x - lsx : p.x - ltx;
    var dy = sourceNode ? p.y - lsy : p.y - lty;
    link.sourceX(sourceNode ? p.x : lsx + dx);
    link.sourceY(sourceNode ? p.y : lsy + dy);
    link.cx(link.cx() + dx);
    link.cy(link.cy() + dy);
    link.targetX(sourceNode ? ltx + dx : p.x);
    link.targetY(sourceNode ? lty + dy : p.y);
  };

  Triple.prototype.connectedPoint = function(node, lx, ly) {
    var nx = node.x();
    var ny = node.y();
    var nwidth = node.width();
    var nheight = node.height();

    var ncx = nx + nwidth / 2;
    var ncy = ny + nheight / 2;

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

  var Cmap = helper.inherits(function(element) {
    if (!(this instanceof Cmap))
      return new Cmap(element);

    this.componentList = this.prop(new ComponentList());
    this.element = this.prop(element || null);

    this.markDirty();
  }, Component);

  Cmap.prototype.createNode = function(props) {
    return new Node(props || {});
  };

  Cmap.prototype.createLink = function(props) {
    return new Link(props || {});
  };

  Cmap.prototype.createConnector = function(props) {
    return new Connector(props || {});
  };

  Cmap.prototype.add = function(component) {
    component.parentElement(this.element());
    this.componentList().add(component);
  };

  Cmap.prototype.remove = function(component) {
    component.parentElement(null);
    this.componentList().remove(component);
  };

  Cmap.prototype.connect = function(type, node, link) {
    if (!node || !link)
      return;

    var linkRelations = link.relations();

    var triple = linkRelations.filter(function(relation) {
      return relation instanceof Triple;
    })[0];

    if (triple && triple[type + 'Node']())
      return;

    if (triple) {
      triple[type + 'Node'](node);
    } else {
      // add triple to link
      var tripleProps = {};
      tripleProps.link = link;
      tripleProps[type + 'Node'] = node;
      triple = new Triple(tripleProps);
      linkRelations.push(triple);
    }

    // add triple to node
    node.relations().push(triple);

    // do not need to mark node dirty (stay unchanged)
    link.markDirty();
  };

  Cmap.prototype.disconnect = function(type, node, link) {
    if (!node || !link)
      return;

    var linkRelations = link.relations();

    var triple = linkRelations.filter(function(relation) {
      return relation instanceof Triple;
    })[0];

    if (!triple)
      return;

    triple[type + 'Node'](null);

    // remove triple from node
    var nodeRelations = node.relations();
    nodeRelations.splice(nodeRelations.indexOf(triple), 1);

    // remove triple from link
    if (!triple.sourceNode() && !triple.targetNode())
      linkRelations.splice(linkRelations.indexOf(triple), 1);

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