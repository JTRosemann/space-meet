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
        if (data.recent == []) {
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
     * Expose the data of this trail for communication.
     * @returns the TrailData of this trail
     */
    to_data(): TrailData<S> {
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
     * Clear all marks before the given threshold `time`.
     * Beware: This may corrupt interpolation _at_ `time`.
     * @param time time threshold
     */
    clear_before(time: number) {
        while (this.marks.inhabited && this.marks.peek()[1] < time) {
            this.marks.dequeue();
        }
    }

    /**
     * If the given `time` is after the latest mark,
     * the latest mark is duplicated at the given timestamp and returned.
     * @param time the time to freeze
     * @returns 
     */
    freeze_last_state_before(time: number): S {
        const latest = this.marks.latest();
        if (latest[1] < time) {
            this.push_mark(latest[0], time);
            return latest[0];
        } else {
            //TODO should this really make the server crash?
            throw Error("trying to change history");
        }
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
            throw Error("trying to change history");
        }
    }

    /**
     * Interpolate the state at `time`.
     * @param time the time of interest
     * @returns the interpolated state
     */
    state_at_time(time: number): S {
        if (this.marks.inhabited()) {
            const peek = this.marks.peek_all();
            let prev = peek[0];
            let curr : [S,number];
            for (let i=0; i < peek.length; i++) {
                curr = peek[i];
                if (curr[1] >= time) {
                    const diff_bef = time - prev[1];
                    const diff_aft = curr[1] - time;
                    const frac = diff_bef / (diff_bef + diff_aft)/* between 0..1 */
                    //TODO is there any other way than "as"?
                    return (prev[0].interpolate(curr[0], frac) as S);
                }
                prev = curr;
            }
            //Assume stable position, if no new info is available
            // this also covers the case where peek == [], but latest != undefined
            return this.marks.latest()[0];
        } else {
            throw Error("no state");
        }
    }
}
