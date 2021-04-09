import { Interpolatable } from "./Interpolatable";

export interface InterpolationQueue<S extends Interpolatable<S>> {
    free_older_than(time: number) : void;
    state_at_time(time: number): S;
}
