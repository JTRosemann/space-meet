import { State } from "./State";

export interface InterpretedInput {
    apply_to(curr_state: State) : State;
}
