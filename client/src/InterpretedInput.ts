
export interface InterpretedInput<S> {
    apply_to(curr_state: S) : S;
}
