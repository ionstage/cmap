var assert = require('assert');
var sinon = require('sinon');
var Cmap = require('../cmap.js');

describe('Cmap', function() {
  it('#node', function() {
    var cmap = Cmap();
    var node = cmap.node({
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

  it('#node - reassign', function() {
    var cmap = Cmap();
    var node = cmap.node();
    node.remove();
    var ret = cmap.node(node);
    assert.equal(node, ret);
    assert.equal(cmap.nodeList().length, 1);
  });

  it('#link', function() {
    var cmap = Cmap();
    var node = cmap.node();
    var link = cmap.link({
      text: 'link',
      source: node,
      target: null
    });
    assert.equal(link.text(), 'link');
    assert.equal(link.source(), node);
    assert.equal(link.target(), null);
  });

  it('#link - reassign', function() {
    var cmap = Cmap();
    var link = cmap.link();
    link.remove();
    var ret = cmap.link(link);
    assert.equal(link, ret);
    assert.equal(cmap.linkList().length, 1);
  });

  it('#nodeList', function() {
    var cmap = Cmap();
    cmap.node();
    cmap.node();
    assert.equal(cmap.nodeList().length, 2);
  });

  it('#linkList', function() {
    var cmap = Cmap();
    cmap.link();
    cmap.link();
    assert.equal(cmap.linkList().length, 2);
  });
});

describe('Node', function() {
  it('#remove', function() {
    var cmap = Cmap();
    var node = cmap.node();
    node.remove();
    assert.equal(cmap.nodeList().length, 0);
  });
});

describe('Link', function() {
  it('#remove', function() {
    var cmap = Cmap();
    var link = cmap.link();
    link.remove();
    assert.equal(cmap.linkList().length, 0);
  });
});