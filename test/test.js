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
      x: 100,
      y: 200,
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
      lineWidth: 4
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

  it('#add', function() {
    var dummy = {};
    var cmap = Cmap(dummy);
    var node = cmap.createNode();
    var link = cmap.createLink();
    cmap.add(node);
    cmap.add(link);
    assert.equal(cmap.element(), dummy);
    assert.equal(cmap.element(), node.parentElement());
    assert.equal(cmap.element(), link.parentElement());
  });

  it('#remove', function() {
    var dummy = {};
    var cmap = Cmap(dummy);
    var node = cmap.createNode();
    var link = cmap.createLink();
    cmap.add(node);
    cmap.add(link);
    cmap.remove(node);
    cmap.remove(link);
    assert.equal(cmap.element(), dummy);
    assert.equal(node.parentElement(), null);
    assert.equal(link.parentElement(), null);
  });
});