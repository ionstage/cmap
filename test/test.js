var assert = require('assert');
var Cmap = require('../cmap.js');

describe('Cmap', function() {
  it('#createNode', function() {
    var cmap = Cmap();
    var attrs = {
      content: 'node',
      x: 100,
      y: 200,
      width: 120,
      height: 45,
      backgroundColor: 'white',
      borderColor: 'black',
      borderWidth: 4,
      textColor: 'black'
    };
    var node = cmap.createNode(attrs);
    for (var key in attrs) {
      assert.equal(node[key](), attrs[key]);
    }
    node = cmap.createNode();
    for (var key in attrs) {
      node[key](attrs[key]);
    }
    for (var key in attrs) {
      assert.equal(node[key](), attrs[key]);
    }
  });

  it('#createLink', function() {
    var cmap = Cmap();
    var attrs = {
      content: 'link',
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
    var link = cmap.createLink(attrs);
    for (var key in attrs) {
      assert.equal(link[key](), attrs[key]);
    }
    link = cmap.createLink();
    for (var key in attrs) {
      link[key](attrs[key]);
    }
    for (var key in attrs) {
      assert.equal(link[key](), attrs[key]);
    }
  });

  it('#createConnector', function() {
    var cmap = Cmap();
    var attrs = {
      x: 100,
      y: 200,
      r: 30,
      color: 'black'
    };
    var connector = cmap.createConnector(attrs);
    for (var key in attrs) {
      assert.equal(connector[key](), attrs[key]);
    }
    connector = cmap.createConnector();
    for (var key in attrs) {
      connector[key](attrs[key]);
    }
    for (var key in attrs) {
      assert.equal(connector[key](), attrs[key]);
    }
  });

  it('#add', function() {
    var dummy = {};
    var cmap = Cmap(dummy);
    var node = cmap.createNode();
    var link = cmap.createLink();
    var connector = cmap.createConnector();
    cmap.add(node);
    cmap.add(link);
    cmap.add(connector);
    assert.equal(cmap.element(), dummy);
    assert.equal(cmap.element(), node.parentElement());
    assert.equal(cmap.element(), link.parentElement());
    assert.equal(cmap.element(), connector.parentElement());
  });

  it('#remove', function() {
    var dummy = {};
    var cmap = Cmap(dummy);
    var node = cmap.createNode();
    var link = cmap.createLink();
    var connector = cmap.createConnector();
    cmap.add(node);
    cmap.add(link);
    cmap.add(connector);
    cmap.remove(node);
    cmap.remove(link);
    cmap.remove(connector);
    assert.equal(cmap.element(), dummy);
    assert.equal(node.parentElement(), null);
    assert.equal(link.parentElement(), null);
    assert.equal(connector.parentElement(), null);
  });

  it('connect', function() {
    var cmap = Cmap();
    var node = cmap.createNode();
    var link = cmap.createLink();
    cmap.connect('source', node, link);
    var nodeRelations = node.relations();
    var linkRelations = link.relations();
    assert.equal(nodeRelations[0].type(), 'source');
    assert.equal(nodeRelations[0], linkRelations[0]);
  });

  it('disconnect', function() {
    var cmap = Cmap();
    var node = cmap.createNode();
    var link = cmap.createLink();
    cmap.connect('source', node, link);
    cmap.disconnect('source', node, link);
    assert.equal(node.relations().length, 0);
    assert.equal(link.relations().length, 0);
  });
});