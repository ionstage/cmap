describe('Paper', function() {
  it('#node', function() {
    var paper = Cmap();
    var node = paper.node({
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

  it('#link', function() {
    var paper = Cmap();
    var node = paper.node();
    var link = paper.link({
      text: 'link',
      source: node,
      target: null
    });
    assert.equal(link.text(), 'link');
    assert.equal(link.source(), node);
    assert.equal(link.target(), null);
  });

  it('#nodeList', function() {
    var paper = Cmap();
    paper.node();
    paper.node();
    assert.equal(paper.nodeList().length, 2);
  });

  it('#linkList', function() {
    var paper = Cmap();
    paper.link();
    paper.link();
    assert.equal(paper.linkList().length, 2);
  });
});