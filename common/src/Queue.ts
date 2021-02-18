
export class Queue<T> {
    private hd: T[] = [];
    private tl: T[] = [];
    private last: T = null;

    enqueue(elem: T): void {
        this.tl.push(elem);
        this.last = elem;
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
            throw Error('Dequeue on empty queque')
        }
    }

    peek() : T {
        if (this.inhabited()) {
            if(this.hd.length == 0) {
                this.hd = this.tl.reverse();
                this.tl = [];
            }
            return this.hd[this.hd.length - 1];
        } else {
            throw Error('Peek on empty queue');
        }
    }

    latest() : T {
        return this.last;
    }
}
