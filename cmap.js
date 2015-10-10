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

    if (!oldObj)
      oldObj = {};

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

    dom.css(element, helper.diffObj(style, cache.style));
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

    dom.attr(lineElement, helper.diffObj(lineAttributes, cache.lineAttributes));
    cache.lineAttributes = lineAttributes;

    // update arrow element
    var arrowAttributes = this.arrowAttributes();
    var arrowElement = element.children[0].childNodes[1];

    dom.attr(arrowElement, helper.diffObj(arrowAttributes, cache.arrowAttributes));
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

    dom.css(contentElement, helper.diffObj(contentStyle, cache.contentStyle));
    cache.contentStyle = contentStyle;
  };

  Link.CONTENT_TYPE_TEXT = 'text';
  Link.CONTENT_TYPE_HTML = 'html';

  var Connector = helper.inherits(function(props) {
    this.x = this.prop(helper.toNumber(props.x, 0));
    this.y = this.prop(helper.toNumber(props.y, 0));
    this.color = this.prop(Connector.COLOR_UNCONNECTED);
    this.element = this.prop(null);
    this.parentElement = this.prop(null);
  }, Component);

  Connector.prototype.style = function() {
    var r = 18;
    var x = this.x() - r;
    var y = this.y() - r;
    var translate = 'translate(' + x + 'px, ' + y + 'px)';

    return {
      backgroundColor: this.color(),
      borderRadius: '50%',
      height: r * 2 + 'px',
      msTransform: translate,
      opacity: 0.6,
      pointerEvents: 'none',
      position: 'absolute',
      transform: translate,
      webkitTransform: translate,
      width: r * 2 + 'px'
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
    this.link = this.prop(props.link || null);
    this.sourceNode = this.prop(props.sourceNode || null);
    this.targetNode = this.prop(props.targetNode || null);
  }, Relation);

  Triple.prototype.update = function(changedComponent) {
    var link = this.link();
    var sourceNode = this.sourceNode();
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
      this.shiftLink(link, sourceNode, targetNode, sourceNode);
  };

  Triple.prototype.updateTargetNode = function(link, sourceNode, targetNode) {
    if (sourceNode)
      this.rotateLink(link, sourceNode, targetNode, targetNode);
    else
      this.shiftLink(link, sourceNode, targetNode, targetNode);
  };

  Triple.prototype.rotateLink = function(link, sourceNode, targetNode, changedNode) {
    var ncx = changedNode.cx();
    var ncy = changedNode.cy();
    var lsx = link.sourceX();
    var lsy = link.sourceY();
    var lcx = link.cx();
    var lcy = link.cy();
    var ltx = link.targetX();
    var lty = link.targetY();

    var p, sncx, sncy, tncx, tncy;

    if (changedNode === sourceNode) {
      // connected point of source node
      p = this.connectedPoint(changedNode, lcx + (ncx - lsx), lcy + (ncy - lsy));

      // source node position (before change)
      sncx = lsx + (ncx - p.x);
      sncy = lsy + (ncy - p.y);

      tncx = targetNode.cx();
      tncy = targetNode.cy();
    } else if (changedNode === targetNode) {
      // connected point of target node
      p = this.connectedPoint(changedNode, lcx + (ncx - ltx), lcy + (ncy - lty));

      // target node position (before change)
      tncx = ltx + (ncx - p.x);
      tncy = lty + (ncy - p.y);

      sncx = sourceNode.cx();
      sncy = sourceNode.cy();
    }

    var ts_dx = tncx - sncx;
    var ts_dy = tncy - sncy;
    var cs_dx = lcx - sncx;
    var cs_dy = lcy - sncy;

    var ts_rad0 = Math.atan2(ts_dy, ts_dx);
    var cs_rad0 = Math.atan2(cs_dy, cs_dx);

    var ts_d0 = Math.sqrt(ts_dx * ts_dx + ts_dy * ts_dy);
    var cs_d0 = Math.sqrt(cs_dx * cs_dx + cs_dy * cs_dy);

    var ts_cs_rad = ts_rad0 - cs_rad0;

    // changed node position
    if (changedNode === sourceNode) {
      sncx = sourceNode.cx();
      sncy = sourceNode.cy();
    } else if (changedNode === targetNode) {
      tncx = targetNode.cx();
      tncy = targetNode.cy();
    }

    ts_dx = tncx - sncx;
    ts_dy = tncy - sncy;

    var ts_rad1 = Math.atan2(ts_dy, ts_dx);
    var cs_rad1 = ts_rad1 - ts_cs_rad;

    var ts_d1 = Math.sqrt(ts_dx * ts_dx + ts_dy * ts_dy);
    var d_rate = (ts_d0 !== 0) ? ts_d1 / ts_d0 : 1;
    var cs_d1 = cs_d0 * d_rate;

    lcx = sncx + cs_d1 * Math.cos(cs_rad1);
    lcy = sncy + cs_d1 * Math.sin(cs_rad1);

    var sp = this.connectedPoint(sourceNode, lcx, lcy);
    var tp = this.connectedPoint(targetNode, lcx, lcy);

    link.sourceX(sp.x);
    link.sourceY(sp.y);
    link.cx(lcx);
    link.cy(lcy);
    link.targetX(tp.x);
    link.targetY(tp.y);
  };

  Triple.prototype.shiftLink = function(link, sourceNode, targetNode, changedNode) {
    var ncx = changedNode.cx();
    var ncy = changedNode.cy();
    var lsx = link.sourceX();
    var lsy = link.sourceY();
    var lcx = link.cx();
    var lcy = link.cy();
    var ltx = link.targetX();
    var lty = link.targetY();

    var p, dx, dy;

    if (changedNode === sourceNode) {
      // connected point of source node
      p = this.connectedPoint(changedNode, ltx + (ncx - lsx), lty + (ncy - lsy));

      // difference between current and changed source point
      dx = p.x - lsx;
      dy = p.y - lsy;
    } else if (changedNode === targetNode) {
      // connected point of target node
      p = this.connectedPoint(changedNode, lsx + (ncx - ltx), lsy + (ncy - lty));

      // difference between current and changed target point
      dx = p.x - ltx;
      dy = p.y - lty;
    }

    link.sourceX(lsx + dx);
    link.sourceY(lsy + dy);
    link.cx(lcx + dx);
    link.cy(lcy + dy);
    link.targetX(ltx + dx);
    link.targetY(lty + dy);
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

  var LinkConnectorRelation = helper.inherits(function(props) {
    this.type = this.prop(props.type || LinkConnectorRelation.TYPE_SOURCE);
    this.link = this.prop(props.link || null);
    this.connector = this.prop(props.connector || null);
  }, Relation);

  LinkConnectorRelation.prototype.isConnected = function(isConnected) {
    var connector = this.connector();

    if (!connector)
      return;

    connector.color(isConnected ? Connector.COLOR_CONNECTED : Connector.COLOR_UNCONNECTED);
  };

  LinkConnectorRelation.prototype.update = function() {
    var type = this.type();
    var link = this.link();
    var connector = this.connector();

    connector.x(link[type + 'X']());
    connector.y(link[type + 'Y']());
  };

  LinkConnectorRelation.TYPE_SOURCE = 'source';
  LinkConnectorRelation.TYPE_TARGET = 'target';

  var Cmap = helper.inherits(function(element) {
    this.componentList = this.prop(new ComponentList());
    this.disabledLinkConnectorRelations = this.prop([]);
    this.element = this.prop(element || null);

    this.markDirty();
  }, Component);

  Cmap.prototype.createNode = function(props) {
    return new Node(props || {});
  };

  Cmap.prototype.createLink = function(props) {
    return new Link(props || {});
  };

  Cmap.prototype.add = function(component) {
    component.parentElement(this.element());
    this.componentList().add(component);
  };

  Cmap.prototype.remove = function(component) {
    component.parentElement(null);
    this.disconnect(component);
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
      var tripleProps = {};
      tripleProps.link = link;
      tripleProps[type + 'Node'] = node;
      triple = new Triple(tripleProps);

      // add triple to the beginning of link relations to be ahead of link-connector relation
      // connector position won't be updated before triple update
      linkRelations.unshift(triple);
    }

    // add triple to node
    node.relations().push(triple);

    // update connectors of link
    linkRelations.forEach(function(relation) {
      if (!(relation instanceof LinkConnectorRelation))
        return;

      var relationType = relation.type();

      if ((type === Cmap.CONNECTION_TYPE_SOURCE &&
            relationType === LinkConnectorRelation.TYPE_SOURCE) ||
          (type === Cmap.CONNECTION_TYPE_TARGET &&
            relationType === LinkConnectorRelation.TYPE_TARGET)) {
        relation.isConnected(true);
      }
    });

    // do not need to mark node dirty (stay unchanged)
    link.markDirty();
  };

  Cmap.prototype.disconnect = function(type, node, link) {
    if (type instanceof Component) {
      var component = type;
      var relations = component.relations().concat();

      // disconnect all connections of component
      relations.forEach(function(relation) {
        if (!(relation instanceof Triple))
          return;

        var link = relation.link();
        var sourceNode = relation.sourceNode();
        var targetNode = relation.targetNode();

        if (component === link) {
          this.disconnect(Cmap.CONNECTION_TYPE_SOURCE, sourceNode, link);
          this.disconnect(Cmap.CONNECTION_TYPE_TARGET, targetNode, link);
        } else if (component === sourceNode) {
          this.disconnect(Cmap.CONNECTION_TYPE_SOURCE, sourceNode, link);
        } else if (component === targetNode) {
          this.disconnect(Cmap.CONNECTION_TYPE_TARGET, targetNode, link);
        }
      }.bind(this));

      return;
    }

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

    // update connectors of link
    linkRelations.forEach(function(relation) {
      if (!(relation instanceof LinkConnectorRelation))
        return;

      var relationType = relation.type();

      if ((type === Cmap.CONNECTION_TYPE_SOURCE &&
            relationType === LinkConnectorRelation.TYPE_SOURCE) ||
          (type === Cmap.CONNECTION_TYPE_TARGET &&
            relationType === LinkConnectorRelation.TYPE_TARGET)) {
        relation.isConnected(false);
      }
    });

    // do not need to mark node dirty (stay unchanged)
    link.markDirty();
  };

  Cmap.prototype.showConnectors = function(link) {
    if (!link)
      return;

    var linkRelations = link.relations();

    var hasLinkConnectorRelation = linkRelations.some(function(relation) {
      return relation instanceof LinkConnectorRelation;
    });

    if (hasLinkConnectorRelation)
      return;

    var disabledLinkConnectorRelations = this.disabledLinkConnectorRelations();

    var sourceConnectorDisabled = disabledLinkConnectorRelations.some(function(relation) {
      return relation.type() === LinkConnectorRelation.TYPE_SOURCE && relation.link() === link;
    });

    var targetConnectorDisabled = disabledLinkConnectorRelations.some(function(relation) {
      return relation.type() === LinkConnectorRelation.TYPE_TARGET && relation.link() === link;
    });

    if (!sourceConnectorDisabled) {
      var sourceConnector = new Connector({
        x: link.sourceX(),
        y: link.sourceY()
      });

      var linkSourceConnectorRelation = new LinkConnectorRelation({
        type: LinkConnectorRelation.TYPE_SOURCE,
        link: link,
        connector: sourceConnector
      });

      var isSourceConnected = linkRelations.some(function(relation) {
        return relation instanceof Triple && !!relation.sourceNode();
      });

      this.add(sourceConnector);
      linkSourceConnectorRelation.isConnected(isSourceConnected);
      linkRelations.push(linkSourceConnectorRelation);
    }

    if (!targetConnectorDisabled) {
      var targetConnector = new Connector({
        x: link.targetX(),
        y: link.targetY()
      });

      var linkTargetConnectorRelation = new LinkConnectorRelation({
        type: LinkConnectorRelation.TYPE_TARGET,
        link: link,
        connector: targetConnector
      });

      var isTargetConnected = linkRelations.some(function(relation) {
        return relation instanceof Triple && !!relation.targetNode();
      });

      this.add(targetConnector);
      linkTargetConnectorRelation.isConnected(isTargetConnected);
      linkRelations.push(linkTargetConnectorRelation);
    }
  };

  Cmap.prototype.hideConnectors = function(link) {
    if (!link)
      return;

    var linkRelations = link.relations();

    // remove connector components
    linkRelations.forEach(function(relation) {
      if (!(relation instanceof LinkConnectorRelation))
        return;

      this.remove(relation.connector());
    }.bind(this));

    // remove link-connector relations from link
    for (var i = linkRelations.length - 1; i >= 0; i--) {
      if (linkRelations[i] instanceof LinkConnectorRelation)
        linkRelations.splice(i, 1);
    }
  };

  Cmap.prototype.enableConnector = function(type, link) {
    if (!link)
      return;

    // remove showing connectors for setting its availability
    this.hideConnectors(link);

    var linkConnectorRelationType;

    if (type === Cmap.CONNECTION_TYPE_SOURCE)
      linkConnectorRelationType = LinkConnectorRelation.TYPE_SOURCE;
    else if (type === Cmap.CONNECTION_TYPE_TARGET)
      linkConnectorRelationType = LinkConnectorRelation.TYPE_TARGET;

    var disabledLinkConnectorRelations = this.disabledLinkConnectorRelations();

    for (var i = disabledLinkConnectorRelations.length - 1; i >= 0; i--) {
      var relation = disabledLinkConnectorRelations[i];

      if (relation.type() === linkConnectorRelationType && relation.link() === link)
        disabledLinkConnectorRelations.splice(i, 1);
    }
  };

  Cmap.prototype.disableConnector = function(type, link) {
    if (!link)
      return;

    // remove showing connectors for setting its availability
    this.hideConnectors(link);

    var linkConnectorRelationType;

    if (type === Cmap.CONNECTION_TYPE_SOURCE)
      linkConnectorRelationType = LinkConnectorRelation.TYPE_SOURCE;
    else if (type === Cmap.CONNECTION_TYPE_TARGET)
      linkConnectorRelationType = LinkConnectorRelation.TYPE_TARGET;

    var disabledLinkConnectorRelations = this.disabledLinkConnectorRelations();

    var hasLinkConnectorRelation = disabledLinkConnectorRelations.some(function(relation) {
      return relation.type() === linkConnectorRelationType && relation.link() === link;
    });

    if (hasLinkConnectorRelation)
      return;

    disabledLinkConnectorRelations.push(new LinkConnectorRelation({
      type: linkConnectorRelationType,
      link: link
    }));
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

  Cmap.CONNECTION_TYPE_SOURCE = 'source';
  Cmap.CONNECTION_TYPE_TARGET = 'target';

  if (typeof module !== 'undefined' && module.exports)
    module.exports = Cmap;
  else
    global.Cmap = Cmap;
})(this);