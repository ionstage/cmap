describe('cmap', function() {
  it('Node', function() {
    var cmap = Cmap();
    var node = cmap.node({
      text: 'node',
      x: 100,
      y: 200,
      width: 120,
      height: 45
    });
    assert.equal(node.text(), 'node');
    assert.equal(node.x(), 100);
    assert.equal(node.y(), 200);
    assert.equal(node.width(), 120);
    assert.equal(node.height(), 45);
    node.x(200);
    assert.equal(node.x(), 200);
  });

  it('Link', function() {
    var cmap = Cmap();
    var node = cmap.node({
      text: 'node'
    });
    var link = cmap.link({
      text: 'link',
      source: node,
      target: null
    });
    assert.equal(link.text(), 'link');
    assert.equal(link.source(), node);
    assert.equal(link.target(), null);
  });
});