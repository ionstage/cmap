var assert = require('assert');
var sinon = require('sinon');
var Cmap = require('../cmap.js');

describe('Cmap', function() {
  it('#createNode', function() {
    var cmap = Cmap();
    var node = cmap.createNode({
      content: 'node',
      x: 100,
      y: 200,
      width: 120,
      height: 45
    });
    assert.equal(node.content(), 'node');
    assert.equal(node.x(), 100);
    assert.equal(node.y(), 200);
    assert.equal(node.width(), 120);
    assert.equal(node.height(), 45);
    node.x(200);
    assert.equal(node.x(), 200);
  });

  it('#createLink', function() {
    var cmap = Cmap();
    var node = cmap.createNode();
    var link = cmap.createLink({
      text: 'link',
      source: node,
      target: null
    });
    assert.equal(link.text(), 'link');
    assert.equal(link.source(), node);
    assert.equal(link.target(), null);
  });

  it('#add', function() {
    var cmap = Cmap();
    var node = cmap.createNode();
    var link = cmap.createLink();
    cmap.add(node);
    cmap.add(link);
    assert.equal(cmap.element(), node.parentElement());
    assert.equal(cmap.element(), link.parentElement());
  });

  it('#remove', function() {
    var cmap = Cmap();
    var node = cmap.createNode();
    var link = cmap.createLink();
    cmap.add(node);
    cmap.add(link);
    cmap.remove(node);
    cmap.remove(link);
    assert.equal(node.parentElement(), null);
    assert.equal(link.parentElement(), null);
  });
});