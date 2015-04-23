describe('cmap', function() {
  it('Paper', function() {
    var element = document.getElementById('cmap');
    var paper = new cmap.Paper({
      element: element
    });
    assert.equal(paper.element(), element);
  });

  it('Node', function() {
    var node = new cmap.Node({
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
    var node = new cmap.Node({
      text: 'node'
    });
    var link = new cmap.Link({
      text: 'link',
      source: node,
      target: null
    });
    assert.equal(link.text(), 'link');
    assert.equal(link.source(), node);
    assert.equal(link.target(), null);
  });
});