import { State } from "./State";
import { Effector } from "./Effector";
import { EuclideanVector } from "./EuclideanVector";
import { EuclideanCircle } from "./EuclideanCircle";

/**
 * This effector should simulate a someone being on a podium.
 */
export class Podium implements Effector<EuclideanCircle> {

    private pos : EuclideanVector;
    private rad : number;

    constructor(pos : EuclideanVector, rad : number) {
        this.pos = pos;
        this.rad = rad;
    }

    covers(state: EuclideanCircle): boolean {
        return state.get_pos().sub(this.pos).get_abs() <= this.rad;
    }

    provoke(ctrl : PresentationCtrl) {
        //TODO separate zones & effectors: effectors are responsible for front-end effects,
        // zones are to decide which effect applies where
        //ctrl.maximize(?)
    }

}

export interface PresentationCtrl {
    mute(id : string) : void;
    maximize(id : string) : void;
}