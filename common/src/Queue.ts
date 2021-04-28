/**
 * A generic Queue class.
 * Supports efficient enqueue & dequeue operations.
 * Additionally it saves the last enqueed element - independent of whether it was removed again.
 * Implemented using two arrays.
 */
export class Queue<T> {
    private hd: T[] = [];
    private tl: T[] = [];
    private last: T = null;

    /**
     * Enqueue `elem`.
     * @param elem element to enqueue
     */
    enqueue(elem: T): void {
        this.tl.push(elem);
        this.last = elem;
    }

    /**
     * Returns whether the queue has any elements
     *  - excluding a possibly saved latest element if that was removed again.
     * @returns whether this queue has elements
     */
    inhabited(): boolean {
        return this.hd.length + this.tl.length > 0;
    }

    /**
     * Gives the length of the queue.
     * If the latest entry was removed, it is not counted.
     * @returns the length of the queue
     */
    length(): number {
        return this.hd.length + this.tl.length;
    }

    /**
     * Dequeue an element.
     * This effectively removes an element from the queue.
     * @returns the element that was dequeued
     */
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

    /**
     * Check which element would be next to dequeue, without dequeing it.
     * @returns the next element to dequeue
     */
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

    /**
     * Returns the latest enqueued element - even if it was already dequeued again.
     * @returns the latest enqueued element
     */
    latest() : T {
        return this.last;
    }

    /**
     * Return all elements of this queue in the order they were enqueued,
     * i.e. `this.peek_all()[0]` is the element that was first enqueued.
     * @returns all elements in the order they were enqueued
     */
    peek_all() : T[] {
        return this.hd.reverse().concat(this.tl);
    }
}
