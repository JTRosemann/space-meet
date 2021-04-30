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
    
    private pos : EuclideanVector;
    private ext : EuclideanVector;

    constructor(pos: EuclideanVector, ext: EuclideanVector) {
        this.pos = pos;
        this.ext = ext;
    }

    create_default(): State {
        const pos = EuclideanVector.create_cartesian(0,0);
        const ext = EuclideanVector.create_polar(0.5, 0);
        return new EuclideanCircle(pos, ext);
    }

    interpolate(other: EuclideanCircle, frac: number): EuclideanCircle {
        const pos = this.pos.interpolate_cartesian(other.get_pos(), frac);
        const ext = this.ext.interpolate_polar(other.get_ext(), frac);
        return new EuclideanCircle(pos, ext);
    }

    /**
     * Get the position.
     * @returns the position
     */
    get_pos(): any {
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
    get_dir() {
        return this.ext.get_phi();
    }

    /**
     * Getter for the radius of this of circle.
     * @returns the radius
     */
    get_rad() {
        return this.ext.get_abs();
    }
}
