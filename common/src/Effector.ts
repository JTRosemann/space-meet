import { State } from "./State";

export interface Effector<S extends State> {
    covers(state: S): boolean;
}
