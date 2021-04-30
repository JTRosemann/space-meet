/**
 * Class representing an euclidean vector
 * - cartesian as well as polar representation can be accessed.
 * Instances are *immutable*.
 */
export class EuclideanVector {

    /**
     * Create a vector using cartesion coordinates.
     * @param x x coordinate
     * @param y y coordinate
     * @returns 
     */
    static create_cartesian(x: number, y: number) {
        return new EuclideanVector(x, y);
    }

    /**
     * Create a vector using polar coordinates.
     * @param r radius
     * @param phi angle
     * @returns 
     */
    static create_polar(r: number, phi: number) {
        return new EuclideanVector(r * Math.cos(phi), r * Math.sin(phi));
    }

    private x: number;
    private y: number;

    private constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    /**
     * Get the x coordinate.
     * @returns the x coordinate
     */
    get_x(): number {
        return this.x;
    }

    /**
     * Get the y coordinate.
     * @returns the y coordinate
     */
    get_y(): number {
        return this.y;
    }

    /**
     * Get the angle of the polar representation of this vector.
     * @returns the angle phi
     */
    get_phi(): number {
        return Math.atan2(this.y, this.x);
    }

    /**
     * Get the absolute value of this vector.
     * @returns the absolute value
     */
    get_abs(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    /**
     * Add two vectors.
     * Both involved vectors are unchanged.
     * @param other the other vector to add
     * @returns the resulting *new* vector
     */
    add(other: EuclideanVector): EuclideanVector {
        return new EuclideanVector(this.get_x() + other.get_x(), this.get_y() + other.get_y());
    }

    /**
     * Compute the negation of this vector.
     * @returns the *new* negated vector
     */
    neg() {
        return new EuclideanVector(-this.get_x(), -this.get_y());
    }

    /**
     * Substract `other` from `this` return the result.
     * @param other the minuend
     * @returns the *newly* constructed subtraction result
     */
    sub(other: EuclideanVector) {
        return new EuclideanVector(this.get_x() - other.get_x(), this.get_y() - other.get_y());
    }

    /**
     * Copy `this`.
     * @returns a copy of `this`
     */
    clone() {
        return new EuclideanVector(this.get_x(), this.get_y());
    }

    /**
     * Compute the linear interpolation between `a` and `b`.
     * @param a start value
     * @param b end value
     * @param frac valuen between 0 and 1 determining the "progress" between a & b
     * @returns 
     */
    static lin_interpolate(a: number, b: number, frac: number) {
        const g_frac = Math.min(1, Math.max(0, frac));
        return a * g_frac + (1 - g_frac) * b;
    }

    /**
     * Compute the linear interpolation of coordinates interpreted cartesianly.
     * @param other the target vector
     * @param frac the fraction determining the "progress" from `this` to `other
     * @returns the interpolated coordinates
     */
    interpolate_cartesian(other: EuclideanVector, frac: number) : EuclideanVector {
        const x = EuclideanVector.lin_interpolate(this.get_x(), other.get_x(), frac);
        const y = EuclideanVector.lin_interpolate(this.get_y(), other.get_y(), frac);
        return EuclideanVector.create_cartesian(x, y);
    }

    /**
     * Compute the linear interpolation of coordinates interpreted polarly.
     * @param other the target vector
     * @param frac the fraction determining the "progress" from `this` to `other
     * @returns the interpolated coordinates
     */
    interpolate_polar(other: EuclideanVector, frac: number) : EuclideanVector {
        const   r = EuclideanVector.lin_interpolate(this.get_abs(), other.get_abs(), frac);
        const phi = EuclideanVector.lin_interpolate(this.get_phi(), other.get_phi(), frac);
        return EuclideanVector.create_polar(r, phi);
    }

}
