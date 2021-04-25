
export interface InterpretedInput<S> {
    get_duration() : number;
    apply_to(curr_state: S) : S;
}
