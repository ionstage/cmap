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
    cmap.add(cmap.createNode());
    cmap.add(cmap.createNode());
    assert.equal(cmap.nodeList().length, 2);
    cmap.add(cmap.createLink());
    cmap.add(cmap.createLink());
    assert.equal(cmap.linkList().length, 2);
  });

  it('#remove', function() {
    var cmap = Cmap();
    var node = cmap.createNode();
    cmap.add(node);
    cmap.remove(node);
    assert.equal(cmap.nodeList().length, 0);
    var link = cmap.createLink();
    cmap.add(link);
    cmap.remove(link);
    assert.equal(cmap.linkList().length, 0);
  });
});