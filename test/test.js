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