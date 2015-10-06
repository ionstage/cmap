var assert = require('assert');
var Cmap = require('../cmap.js');

describe('Cmap', function() {
  it('#createNode', function() {
    var cmap = new Cmap();
    var props = {
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
    var node = cmap.createNode(props);
    for (var key in props) {
      assert.equal(node[key](), props[key]);
    }
    node = cmap.createNode();
    for (var key in props) {
      node[key](props[key]);
    }
    for (var key in props) {
      assert.equal(node[key](), props[key]);
    }
  });

  it('#createLink', function() {
    var cmap = new Cmap();
    var props = {
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
    var link = cmap.createLink(props);
    for (var key in props) {
      assert.equal(link[key](), props[key]);
    }
    link = cmap.createLink();
    for (var key in props) {
      link[key](props[key]);
    }
    for (var key in props) {
      assert.equal(link[key](), props[key]);
    }
  });

  it('#createConnector', function() {
    var cmap = new Cmap();
    var props = {
      x: 100,
      y: 200,
      r: 30,
      color: 'black'
    };
    var connector = cmap.createConnector(props);
    for (var key in props) {
      assert.equal(connector[key](), props[key]);
    }
    connector = cmap.createConnector();
    for (var key in props) {
      connector[key](props[key]);
    }
    for (var key in props) {
      assert.equal(connector[key](), props[key]);
    }
  });

  it('#add', function() {
    var dummy = {};
    var cmap = new Cmap(dummy);
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
    var cmap = new Cmap(dummy);
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

  it('#remove - connection', function() {
    var cmap = new Cmap();
    var sourceNode = cmap.createNode();
    var link = cmap.createLink();
    var targetNode = cmap.createNode();
    cmap.connect(Cmap.CONNECTION_TYPE_SOURCE, sourceNode, link);
    cmap.connect(Cmap.CONNECTION_TYPE_TARGET, targetNode, link);
    cmap.remove(sourceNode);
    var triple = link.relations()[0];
    assert.equal(triple.sourceNode(), null);
    cmap.remove(link);
    assert.equal(targetNode.relations().length, 0);
  });

  it('#connect', function() {
    var cmap = new Cmap();
    var sourceNode = cmap.createNode();
    var link = cmap.createLink();
    var targetNode = cmap.createNode();
    var sourceNodeRelations = sourceNode.relations();
    var linkRelations = link.relations();
    var targetNodeRelations = targetNode.relations();
    cmap.connect(Cmap.CONNECTION_TYPE_SOURCE, sourceNode, link);
    var triple = sourceNodeRelations[0];
    assert.equal(triple, linkRelations[0]);
    assert.equal(triple.sourceNode(), sourceNode);
    assert.equal(triple.link(), link);
    assert.equal(triple.targetNode(), null);
    cmap.connect(Cmap.CONNECTION_TYPE_TARGET, targetNode, link);
    assert.equal(triple, targetNodeRelations[0]);
    assert.equal(triple.targetNode(), targetNode);
  });

  it('#disconnect', function() {
    var cmap = new Cmap();
    var node = cmap.createNode();
    var link = cmap.createLink();
    cmap.connect(Cmap.CONNECTION_TYPE_SOURCE, node, link);
    cmap.disconnect(Cmap.CONNECTION_TYPE_SOURCE, node, link);
    assert.equal(node.relations().length, 0);
    assert.equal(link.relations().length, 0);
  });
});