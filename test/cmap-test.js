var assert = require('assert');
var sinon = require('sinon');
var Cmap = require('../cmap.js');

describe('Cmap', function() {
  var cmap;

  beforeEach(function() {
    cmap = Cmap();
  });

  it('#node', function() {
    assert.doesNotThrow(function() { cmap.node(); });
    assert.doesNotThrow(function() { cmap.node({}); });
    assert.throws(function() { cmap.node(null); }, TypeError);
    assert.throws(function() { cmap.node('a'); }, TypeError);
    assert.throws(function() { cmap.node(1); }, TypeError);
    assert.throws(function() { cmap.node([]); }, TypeError);
  });

  it('#link', function() {
    assert.doesNotThrow(function() { cmap.link(); });
    assert.doesNotThrow(function() { cmap.link({}); });
    assert.throws(function() { cmap.link(null); }, TypeError);
    assert.throws(function() { cmap.link('a'); }, TypeError);
    assert.throws(function() { cmap.link(1); }, TypeError);
    assert.throws(function() { cmap.link([]); }, TypeError);
  });
});

describe('Node', function() {
  var cmap;
  var cmapComponent;

  before(function() {
    // for internal access
    Cmap.prototype._component = function() {
      return this.component;
    };
  });

  beforeEach(function() {
    cmap = Cmap();
    cmapComponent = cmap._component();
  });

  describe('#attr', function() {
    var props = {
      content: 'node',
      contentType: 'html',
      x: 100,
      y: 200,
      width: 120,
      height: 45,
      backgroundColor: 'white',
      borderColor: 'black',
      borderWidth: 4,
      textColor: 'black'
    };

    it('attr()', function() {
      var node = cmap.node(props);
      assert.deepEqual(node.attr(), props);
    });

    it('attr(key)', function() {
      var node = cmap.node(props);
      for (var key in props) {
        assert.equal(node.attr(key), props[key]);
      }
    });

    it('attr(key, value)', function() {
      var node = cmap.node();
      for (var key in props) {
        node.attr(key, props[key]);
      }
      assert.deepEqual(node.attr(), props);
    });

    it('attr(props)', function() {
      var node = cmap.node();
      node.attr(props);
      assert.deepEqual(node.attr(), props);
    });

    it('validate type of value', function() {
      var node = cmap.node(props);
      node.attr({
        content: 1,
        contentType: 1,
        x: '200',
        y: '300',
        width: '220',
        height: '145',
        backgroundColor: 1,
        borderColor: 1,
        borderWidth: '8',
        textColor: 1
      });
      assert.deepStrictEqual(node.attr(), {
        content: '1',
        contentType: 'html',
        x: 200,
        y: 300,
        width: 220,
        height: 145,
        backgroundColor: '1',
        borderColor: '1',
        borderWidth: 8,
        textColor: '1'
      });
    });
  });

  it('#remove', function() {
    var node = cmap.node();
    var nodeComponent = node(cmapComponent).component;
    cmapComponent.remove = sinon.spy();
    node.remove();
    assert(cmapComponent.remove.calledWith(nodeComponent));
  });

  it('#toFront', function() {
    var node = cmap.node();
    var nodeComponent = node(cmapComponent).component;
    cmapComponent.toFront = sinon.spy();
    node.toFront();
    assert(cmapComponent.toFront.calledWith(nodeComponent));
  });

  it('#element', function() {
    var node = cmap.node();
    var nodeComponent = node(cmapComponent).component;
    var dummy = {};
    nodeComponent.element = sinon.spy(function() {
      return dummy;
    });
    assert.strictEqual(node.element(), dummy);
  });

  it('#redraw', function() {
    var node = cmap.node();
    var nodeComponent = node(cmapComponent).component;
    nodeComponent.redraw = sinon.spy();
    node.redraw();
    assert(nodeComponent.redraw.called);
  });

  describe('#draggable', function() {
    it('draggable()', function() {
      var node = cmap.node();
      assert.equal(node.draggable(), true);
      node.draggable(false);
      assert.equal(node.draggable(), false);
    });

    it('draggable(enabled)', function() {
      var node = cmap.node();
      var nodeComponent = node(cmapComponent).component;
      cmapComponent.enableDrag = sinon.spy();
      node.draggable(true);
      assert(cmapComponent.enableDrag.calledWith(nodeComponent));
      cmapComponent.disableDrag = sinon.spy();
      node.draggable(false);
      assert(cmapComponent.disableDrag.calledWith(nodeComponent));
    });
  });
});

describe('Link', function() {
  var cmap;
  var cmapComponent;

  before(function() {
    // for internal access
    Cmap.prototype._component = function() {
      return this.component;
    };
  });

  beforeEach(function() {
    cmap = Cmap();
    cmapComponent = cmap._component();
  });

  describe('#attr', function() {
    var props = {
      content: 'link',
      contentType: 'html',
      cx: 100,
      cy: 200,
      width: 120,
      height: 45,
      backgroundColor: 'black',
      borderColor: 'white',
      borderWidth: 4,
      textColor: 'white',
      sourceX: 50,
      sourceY: 100,
      targetX: 150,
      targetY: 300,
      lineColor: 'white',
      lineWidth: 4,
      hasArrow: true
    };

    it('attr()', function() {
      var link = cmap.link(props);
      assert.deepEqual(link.attr(), props);
    });

    it('attr(key)', function() {
      var link = cmap.link(props);
      for (var key in props) {
        assert.equal(link.attr(key), props[key]);
      }
    });

    it('attr(key, value)', function() {
      var link = cmap.link();
      for (var key in props) {
        link.attr(key, props[key]);
      }
      assert.deepEqual(link.attr(), props);
    });

    it('attr(props)', function() {
      var link = cmap.link();
      link.attr(props);
      assert.deepEqual(link.attr(), props);
    });

    it('validate type of value', function() {
      var link = cmap.link(props);
      link.attr({
        content: 1,
        contentType: 1,
        cx: '200',
        cy: '300',
        width: '320',
        height: '145',
        backgroundColor: 1,
        borderColor: 1,
        borderWidth: '8',
        textColor: 1,
        sourceX: '150',
        sourceY: '200',
        targetX: '250',
        targetY: '400',
        lineColor: 1,
        lineWidth: '8',
        hasArrow: 1
      });
      assert.deepStrictEqual(link.attr(), {
        content: '1',
        contentType: 'html',
        cx: 200,
        cy: 300,
        width: 320,
        height: 145,
        backgroundColor: '1',
        borderColor: '1',
        borderWidth: 8,
        textColor: '1',
        sourceX: 150,
        sourceY: 200,
        targetX: 250,
        targetY: 400,
        lineColor: '1',
        lineWidth: 8,
        hasArrow: true
      });
    });
  });

  it('#remove', function() {
    var link = cmap.link();
    var linkComponent = link(cmapComponent).component;
    cmapComponent.remove = sinon.spy();
    link.remove();
    assert(cmapComponent.remove.calledWith(linkComponent));
  });

  it('#toFront', function() {
    var link = cmap.link();
    var linkComponent = link(cmapComponent).component;
    cmapComponent.toFront = sinon.spy();
    link.toFront();
    assert(cmapComponent.toFront.calledWith(linkComponent));
  });

  it('#element', function() {
    var link = cmap.link();
    var linkComponent = link(cmapComponent).component;
    var dummy = {};
    linkComponent.element = sinon.spy(function() {
      return dummy;
    });
    assert.strictEqual(link.element(), dummy);
  });

  it('#redraw', function() {
    var link = cmap.link();
    var linkComponent = link(cmapComponent).component;
    linkComponent.redraw = sinon.spy();
    link.redraw();
    assert(linkComponent.redraw.called);
  });

  describe('#draggable', function() {
    it('draggable()', function() {
      var link = cmap.link();
      assert.equal(link.draggable(), true);
      link.draggable(false);
      assert.equal(link.draggable(), false);
    });

    it('draggable(enabled)', function() {
      var link = cmap.link();
      var linkComponent = link(cmapComponent).component;
      cmapComponent.enableDrag = sinon.spy();
      link.draggable(true);
      assert(cmapComponent.enableDrag.calledWith(linkComponent));
      cmapComponent.disableDrag = sinon.spy();
      link.draggable(false);
      assert(cmapComponent.disableDrag.calledWith(linkComponent));
    });
  });

  describe('#sourceNode', function() {
    it('sourceNode()', function() {
      var link = cmap.link();
      var node = cmap.node();
      assert.equal(link.sourceNode(), null);
      link.sourceNode(node);
      assert.equal(link.sourceNode(), node);
    });

    it('sourceNode(node)', function() {
      var link = cmap.link();
      var node = cmap.node();
      var linkComponent = link(cmapComponent).component;
      var nodeComponent = node(cmapComponent).component;
      cmapComponent.connect = sinon.spy();
      link.sourceNode(node);
      assert(cmapComponent.connect.calledWith('source', nodeComponent, linkComponent));
    });

    it('sourceNode(null)', function() {
      var link = cmap.link();
      var node = cmap.node();
      var linkComponent = link(cmapComponent).component;
      var nodeComponent = node(cmapComponent).component;
      link.sourceNode(node);
      cmapComponent.disconnect = sinon.spy();
      link.sourceNode(null);
      assert(cmapComponent.disconnect.calledWith('source', nodeComponent, linkComponent));
    });

    it('should throw exception for invalid node', function() {
      var link = cmap.link();
      var node = cmap.node();
      var nodeComponent = node(cmapComponent).component;
      assert.throws(function() { link.sourceNode({}); }, TypeError);
      assert.throws(function() {
        link.sourceNode(function() {
          return {
            component: nodeComponent
          };
        });
      }, TypeError);
    });
  });

  describe('#targetNode', function() {
    it('targetNode()', function() {
      var link = cmap.link();
      var node = cmap.node();
      assert.equal(link.targetNode(), null);
      link.targetNode(node);
      assert.equal(link.targetNode(), node);
    });

    it('targetNode(node)', function() {
      var link = cmap.link();
      var node = cmap.node();
      var linkComponent = link(cmapComponent).component;
      var nodeComponent = node(cmapComponent).component;
      cmapComponent.connect = sinon.spy();
      link.targetNode(node);
      assert(cmapComponent.connect.calledWith('target', nodeComponent, linkComponent));
    });

    it('targetNode(null)', function() {
      var link = cmap.link();
      var node = cmap.node();
      var linkComponent = link(cmapComponent).component;
      var nodeComponent = node(cmapComponent).component;
      link.targetNode(node);
      cmapComponent.disconnect = sinon.spy();
      link.targetNode(null);
      assert(cmapComponent.disconnect.calledWith('target', nodeComponent, linkComponent));
    });

    it('should throw exception for invalid node', function() {
      var link = cmap.link();
      var node = cmap.node();
      var nodeComponent = node(cmapComponent).component;
      assert.throws(function() { link.targetNode({}); }, TypeError);
      assert.throws(function() {
        link.targetNode(function() {
          return {
            component: nodeComponent
          };
        });
      }, TypeError);
    });
  });

  describe('#sourceConnectorEnabled', function() {
    it('sourceConnectorEnabled()', function() {
      var link = cmap.link();
      assert.equal(link.sourceConnectorEnabled(), true);
      link.sourceConnectorEnabled(false);
      assert.equal(link.sourceConnectorEnabled(), false);
    });

    it('sourceConnectorEnabled(enabled)', function() {
      var link = cmap.link();
      var linkComponent = link(cmapComponent).component;
      cmapComponent.enableConnector = sinon.spy();
      link.sourceConnectorEnabled(true);
      assert(cmapComponent.enableConnector.calledWith('source', linkComponent));
      cmapComponent.disableConnector = sinon.spy();
      link.sourceConnectorEnabled(false);
      assert(cmapComponent.disableConnector.calledWith('source', linkComponent));
    });
  });

  describe('#targetConnectorEnabled', function() {
    it('targetConnectorEnabled()', function() {
      var link = cmap.link();
      assert.equal(link.targetConnectorEnabled(), true);
      link.targetConnectorEnabled(false);
      assert.equal(link.targetConnectorEnabled(), false);
    });

    it('targetConnectorEnabled(enabled)', function() {
      var link = cmap.link();
      var linkComponent = link(cmapComponent).component;
      cmapComponent.enableConnector = sinon.spy();
      link.targetConnectorEnabled(true);
      assert(cmapComponent.enableConnector.calledWith('target', linkComponent));
      cmapComponent.disableConnector = sinon.spy();
      link.targetConnectorEnabled(false);
      assert(cmapComponent.disableConnector.calledWith('target', linkComponent));
    });
  });
});
