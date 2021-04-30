import { Queue } from "./Queue";
import { State } from "./State";

export interface TrailData<S extends State> {
    recent: [S,number][],
    latest: [S,number]
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

    constructor(init_state : S, init_time : number) {
        this.marks = new Queue();
        this.marks.enqueue([init_state, init_time]);
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
            for (let i=0; i++; i < peek.length) {
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
            return curr[0];//Assume stable position, if no new info is available
        } else {
            throw Error("no state");
        }
    }
}
