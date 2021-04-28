import { Interpolatable } from "./Interpolatable";


export interface State extends Interpolatable<State> {
    /**
     * Create some default state.
     */
    create_default() : State;
}
