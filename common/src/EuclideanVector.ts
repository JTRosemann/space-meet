/**
 * Class representing an euclidean vector
 * - cartesian as well as polar representation can be accessed.
 * Instances are *immutable*.
 */
export class EuclideanVector {
    
    static establish(ext: EuclideanVector): EuclideanVector {
        return EuclideanVector.create_cartesian(ext.x, ext.y);
    }

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

    static mod(n: number, m: number) : number {
        return ((n % m) + m) % m;
    }

    static to_range_zero_2pi(alpha: number) : number {
        return EuclideanVector.mod(alpha, 2*Math.PI);
    }

    static to_range_mpi_pi(alpha: number) : number {
        const res = EuclideanVector.to_range_zero_2pi(alpha);
        return res >= Math.PI ? res - 2*Math.PI : res;
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
     * The codomain of this function is an interval of length 2*PI.
     * @returns the angle phi
     */
    get_phi(): number {
        return Math.atan2(this.y, this.x);
    }

    /**
     * Get the square of the absolute value of this vector
     * @returns the square of the absolute value
     */
    get_abs_sq(): number {
        return this.x * this.x + this.y * this.y;
    }

    /**
     * Get the absolute value of this vector.
     * @returns the absolute value
     */
    get_abs(): number {
        return Math.sqrt(this.get_abs_sq());
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
     * Compute the angle between `a` and `b` corresponding to the origin `this`.
     * @param a one vector
     * @param b another vector
     * @returns angle between `a` and `b` in range (-π,π]
     */
    angle_between_at_this(a: EuclideanVector, b: EuclideanVector) {
        const alpha = a.sub(this).get_phi();
        const beta  = b.sub(this).get_phi();
        return EuclideanVector.to_range_mpi_pi(beta - alpha);
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
        return b * g_frac + (1 - g_frac) * a;
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
        let t_phi = this.get_phi();
        let o_phi = other.get_phi();
        // we want to interpolate the shortest path between two angles,
        // thus if their radians are e.g. 0 & 3/2*PI, we need to add 2*PI to the smaller angle.
        // this relies on the fact that two values returned `get_phi()` always have difference < 2*PI
        if (t_phi - o_phi > Math.PI) {
            o_phi += 2*Math.PI;
        }
        if (o_phi - t_phi > Math.PI) {
            t_phi += 2*Math.PI;
        }
        const phi = EuclideanVector.lin_interpolate(t_phi, o_phi, frac);
        return EuclideanVector.create_polar(r, phi);
    }

}
