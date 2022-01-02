import { EuclideanVector } from "./EuclideanVector";
import { State } from "./State";

export class EuclideanCircle implements State {

    /**
     * Create a circle given position `pos`, radius `rad` and facing direction `phi`.
     * @param pos the position of the center
     * @param rad the radius
     * @param phi the facing direction
     * @returns 
     */
    static create_from_pos_dir_rad(pos : EuclideanVector, rad : number, phi : number): EuclideanCircle {
        return new EuclideanCircle(pos, EuclideanVector.create_polar(rad, phi))
    }

    /**
     * Establish an EuclideanCircle from transmission data.
     * @param data the data to establish
     * @returns an established EuclideanCircle
     */
    static establish(data : EuclideanCircle) {
        return new EuclideanCircle(EuclideanVector.establish(data.pos), EuclideanVector.establish(data.ext))
    }
    
    private pos : EuclideanVector;
    private ext : EuclideanVector;

    constructor(pos: EuclideanVector, ext: EuclideanVector) {
        this.pos = pos;
        this.ext = ext;
    }

    /**
     * Create a default EuclideanCircle
     * @returns a default State
     */
    create_default(): State {
        const pos = EuclideanVector.create_cartesian(0,0);
        const ext = EuclideanVector.create_polar(0.5, 0);//TODO is it reaaally necessary to define a default here?
        return new EuclideanCircle(pos, ext);
    }

    /** 
     * @inheritdoc
     * Realized by linear interpolation of position and size and angular interpolation of the direction.
     * @param other the target State to interpolate to
     * @param frac 
     * @returns 
     */
    interpolate(other: EuclideanCircle, frac: number): EuclideanCircle {
        const pos = this.pos.interpolate_cartesian(other.get_pos(), frac);
        const ext = this.ext.interpolate_polar(other.get_ext(), frac);
        return new EuclideanCircle(pos, ext);
    }

    /**
     * Get the position.
     * @returns the position
     */
    get_pos() {
        return this.pos;
    }

    /**
     * Get the extend/orientation, i.e. the radius of the object and it's pointing direction
     * as a vector.
     * @returns the extend/orientation
     */
    get_ext() {
        return this.ext;
    }

    /**
     * Getter for the facing direction.
     * @returns direction of this circle
     */
    get_dir() : number {
        return this.ext.get_phi();
    }

    /**
     * Getter for the radius of this of circle.
     * @returns the radius
     */
    get_rad() {
        return this.ext.get_abs();
    }

    /**
     * Retrieve the angle between the direction of `this` and the relative position of `v`
     * @param v a vector
     * @returns angle between the direction of `this` and the relative position of `v`
     */
    get_relative_angle(v: EuclideanVector) {
        return this.get_pos().angle_between_at_this(this.get_pos().add(this.get_ext()), v);
    }
}
