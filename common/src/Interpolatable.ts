
export interface Interpolatable<A> {
    /**
     * Interpolate between two interpolatbles.
     * Given a `frac` of `0`, a clone of this is returned.
     * Given a `frac` of `1`, a clone of other is returned.
     * Otherwise some value inbetween is constructed.
     * @param other the other interpolatable
     * @param frac a number between 0 & 1, representing the fraction of the other
     */
    interpolate(other: A, frac: number): A;
}

