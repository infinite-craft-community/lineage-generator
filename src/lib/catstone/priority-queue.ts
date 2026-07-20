// Priority Queue - https://stackoverflow.com/a/42919752
const pqTop = 0;
const pqParent = (i) => ((i + 1) >>> 1) - 1;
const pqLeft = (i) => (i << 1) + 1;
const pqRight = (i) => (i + 1) << 1;

class PriorityQueue {
  constructor(comparator = (a, b) => a > b) {
    this._heap = [];
    this._comparator = comparator;
  }
  size() {
    return this._heap.length;
  }
  isEmpty() {
    return this.size() == 0;
  }
  peek() {
    return this._heap[pqTop];
  }
  push(...values) {
    values.forEach((value) => {
      this._heap.push(value);
      this._siftUp();
    });
    return this.size();
  }
  pop() {
    const poppedValue = this.peek();
    const bottom = this.size() - 1;
    if (bottom > pqTop) {
      this._swap(pqTop, bottom);
    }
    this._heap.pop();
    this._siftDown();
    return poppedValue;
  }
  replace(value) {
    const replacedValue = this.peek();
    this._heap[pqTop] = value;
    this._siftDown();
    return replacedValue;
  }
  _greater(i, j) {
    return this._comparator(this._heap[i], this._heap[j]);
  }
  _swap(i, j) {
    [this._heap[i], this._heap[j]] = [this._heap[j], this._heap[i]];
  }
  _siftUp() {
    let node = this.size() - 1;
    while (node > pqTop && this._greater(node, pqParent(node))) {
      this._swap(node, pqParent(node));
      node = pqParent(node);
    }
  }
  _siftDown() {
    let node = pqTop;
    while (
      (pqLeft(node) < this.size() && this._greater(pqLeft(node), node)) ||
      (pqRight(node) < this.size() && this._greater(pqRight(node), node))
    ) {
      let maxChild =
        pqRight(node) < this.size() &&
        this._greater(pqRight(node), pqLeft(node))
          ? pqRight(node)
          : pqLeft(node);
      this._swap(node, maxChild);
      node = maxChild;
    }
  }
}

export { PriorityQueue };
