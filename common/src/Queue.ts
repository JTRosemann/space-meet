
export class Queue<T> {
    hd: T[] = [];
    tl: T[] = [];

    enqueue(elem: T): void {
        this.tl.push(elem);
    }

    inhabited(): boolean {
        return this.hd.length + this.tl.length > 0;
    }

    length(): number {
        return this.hd.length + this.tl.length;
    }

    dequeue(): T {
        if (this.inhabited()) {
            if (this.hd.length == 0) {
                this.hd = this.tl.reverse();
                this.tl = [];
            }
            return this.hd.pop();
        } else {
            console.warn('Dequeue on empty queue.');
            return null; // queue is empty
        }
    }
}
