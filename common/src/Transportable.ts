/**
 * A Transportable can be communicated via messages.
 */
export interface Transportable<T> {
    transport(): T;
    incorporate(T) : void;
}
