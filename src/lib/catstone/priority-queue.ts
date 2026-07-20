// Priority Queue - https://stackoverflow.com/a/42919752
const pqTop = 0;
const pqParent = (i: number) => ((i + 1) >>> 1) - 1;
const pqLeft = (i: number) => (i << 1) + 1;
const pqRight = (i: number) => (i + 1) << 1;

type Comparator<T> = (a: T, b: T) => boolean;

class PriorityQueue<T> {
  _heap: T[];
  _comparator: Comparator<T>;

  constructor(comparator: Comparator<T> = (a, b) => (a as any) > (b as any)) {
    this._heap = [];
    this._comparator = comparator;
  }

  push(value: T) {
    this._heap.push(value);
    let node = this._heap.length - 1;
    while (node > pqTop) {
      const parent = pqParent(node);
      if (this._comparator(this._heap[node], this._heap[parent])) {
        const tmp = this._heap[node];
        this._heap[node] = this._heap[parent];
        this._heap[parent] = tmp;
        node = parent;
      } else {
        break;
      }
    }
    return this._heap.length;
  }

  pop(): T {
    const poppedValue = this._heap[pqTop]!;
    const bottom = this._heap.length - 1;
    if (bottom > pqTop) {
      this._heap[pqTop] = this._heap[bottom]!;
      this._heap[bottom] = poppedValue;
    }
    this._heap.pop();

    let node = pqTop;
    const len = this._heap.length;
    while (true) {
      const left = pqLeft(node);
      const right = pqRight(node);
      let best = node;

      if (left < len && this._comparator(this._heap[left], this._heap[best])) {
        best = left;
      }
      if (
        right < len &&
        this._comparator(this._heap[right], this._heap[best])
      ) {
        best = right;
      }
      if (best === node) break;

      const tmp = this._heap[node]!;
      this._heap[node] = this._heap[best]!;
      this._heap[best] = tmp;
      node = best;
    }

    return poppedValue;
  }

  isEmpty() {
    return this._heap.length === 0;
  }
}

export { PriorityQueue };
