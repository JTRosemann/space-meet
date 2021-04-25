import { State } from "./State";

export interface Trail<S extends State> {
    free_older_than(time: number) : void;
    state_at_time(time: number): S;
}
