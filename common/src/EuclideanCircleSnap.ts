import { Snap } from "./Snap";
import { EuclideanCircle as EuclideanCircle } from "./EuclideanCircle";
import { Effector } from "./Effector";
import { Physics } from "./Physics";

export class EuclidianCircleSnap implements Snap<EuclideanCircle> {

    private states : Record<string,EuclideanCircle>;
    private effectors : Effector<EuclideanCircle>[];
    private physics: Physics<EuclideanCircle>;

    constructor(physics : Physics<EuclideanCircle>, 
            effectors : Effector<EuclideanCircle>[] = [], 
            states : Record<string,EuclideanCircle> = {}) {
        this.physics = physics;
        this.effectors = effectors;
        this.states = states;
    }
    
    get_physics(): Physics<EuclideanCircle> {
        return this.physics;
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
