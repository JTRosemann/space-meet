import { Snap } from "./Snap";
import { EuclideanCircle as EuclideanCircle } from "./EuclideanCircle";
import { Effector } from "./Effector";

export class EuclidianCircleSnap implements Snap<EuclideanCircle> {

    private states : Record<string,EuclideanCircle>;
    private effectors : Effector<EuclideanCircle>[];

    constructor(effectors : Effector<EuclideanCircle>[] = [], states : Record<string,EuclideanCircle> = {}) {
        this.effectors = effectors;
        this.states = states;
    }

    get_effectors(): Effector<EuclideanCircle>[] {
        return this.effectors;
    }

    get_states(): Record<string, EuclideanCircle> {
        return this.states;
    }

    set_player(viewer_id: string, new_state: EuclideanCircle): void {
        this.states[viewer_id] = new_state;
    }

    get_player_state(viewer_id: string): EuclideanCircle {
        return this.states[viewer_id];
    }
}
