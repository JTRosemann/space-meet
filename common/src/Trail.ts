import { Queue } from "./Queue";
import { State } from "./State";

export interface TrailData<S extends State> {
    recent: [S,number][],
    latest: [S,number]
}

export class TrailFactory<S extends State> {

    /**
     * Create a trail consisting only of one entry.
     * @param init_state initial state
     * @param init_time initial time
     * @returns a singleton trail
     */
    create_singleton_trail(init_state : S, init_time : number) {
        const marks = new Queue<[S,number]>();
        marks.enqueue([init_state, init_time]);
        return new Trail(marks);
    }

    /**
     * Realize a trail from data.
     * @param data a trail as data
     * @returns a trail correponding to the trail data
     */
    realize(data : TrailData<S>) : Trail<S> {
        const queue = new Queue<[S,number]>();
        if (data.recent.length == 0) {
            //if recent is empty we have to pseudo-enqueue the latest element
            queue.enqueue(data.latest);
            queue.dequeue();
        } else {
            queue.enqueue_list(data.recent);
        }
        return new Trail(queue);
    }

}

export class Trail<S extends State> {
    
    /**
     * Get the timestamp of the latest state
     * @returns the time of latest state
     */
    get_latest_time(): number {
        return this.marks.latest()[1];
    }
    
    /**
     * Expose the data of this trail for communication.
     * @returns the TrailData of this trail
     */
    to_data(): TrailData<S> {
        if (this.marks.latest() == undefined) console.warn('latest undefined');
        return {
            recent: this.marks.peek_all(),
            latest: this.marks.latest()
        };
    }

    /*
    Implementation note:
    This keeps a queue with the invariant that all elements are ordered by time.
    It is optimised for the case that only strictly newer entries (by time) are added.
    */

    private marks : Queue<[S,number]> = new Queue();

    constructor(marks : Queue<[S,number]> = new Queue()) {
        this.marks = marks;
    }

    /**
     * Clear all marks.
     */
    clear() {
        while (this.marks.inhabited()) {
            this.marks.dequeue();
        }
    }

    /**
     * Clear all marks at least one mark before the given threshold `time`.
     * One mark directly before the threshold is kept
     *  to avoid corrupting interpolation at `time`.
     * @param time time threshold
     */
    clear_strict_before(time: number) {
        while (this.marks.length() >= 2 && this.marks.peek2()[1] < time) {
            this.marks.dequeue();
        }
    }

    /**
     * If the given `time` is greater or equal to the latest mark,
     * the latest mark is returned.
     * Otherwise a warning is issued.
     * @param time the time to freeze
     * @returns the latest mark
     */
    get_last_state_leq(time: number): S {
        const latest = this.marks.latest();
        if (latest[1] > time) {
            console.warn("trying to change history: " + latest[1] + " > " + time);
        }
        return latest[0];
    }

    /**
     * This pushes `new_state` to the queue at `time`.
     * It throws an error if the new mark is older than a given mark.
     * @param new_state new state to add
     * @param time timestamp when `new_state` is reached 
     */
    push_mark(new_state: S, time: number): void {
        if (this.marks.latest()[1] < time) {
            this.marks.enqueue([new_state, time]);
        } else {
            //TODO should this really make the server crash?
            console.warn("trying to change history");
        }
    }

    /**
     * Enqueue all the elements of `other` on `this.
     * @param other other trail to concat
     */
    concat(other: Trail<S>) {
        this.marks.enqueue_list(other.marks.peek_all());
    }

    /**
     * Interpolate the state at `time` and remove all older data.
     * @param time the time of interest
     * @returns the interpolated state
     */
    state_at_time(time: number): S {
        //TODO also use peek2 and dequeue older stuff
        while (true) {
            if (this.marks.length() < 2) {
                //Assume stable position, if no new info is available
                return this.marks.latest()[0];
            }
            const next = this.marks.peek();
            if (next[1] >= time) {
                //Assume stable position if requesting future (shouldn't happen)
                return this.marks.latest()[0];
            }
            // next[1] < time
            const next2 = this.marks.peek2();
            if (next2[1] >= time) {
                //next2[1] >= time
                const diff_bef = time - next[1];// > 0
                const diff_aft = next2[1] - time;// >= 0
                const frac = diff_bef / (diff_bef + diff_aft);// > 0 & <= 1
                //TODO is there any other way than "as"?
                return (next[0].interpolate(next2[0], frac) as S);
            } else {
                this.marks.dequeue();
            }

        }
    }
}
