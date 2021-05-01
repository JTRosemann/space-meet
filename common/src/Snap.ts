import { Effector } from "./Effector";
import { Physics } from "./Physics";
import { State } from "./State";

export interface Snap<S extends State> {

    /**
     * Get the physics of this snap.
     * @returns a physics object
     */
    get_physics(): Physics<S>;

    /**
     * Get a list of Effectors.
     * @returns list of Effectors
     */
    get_effectors(): Effector<S>[];

    /**
     * Get a record containg a map from player IDs to states.
     * @returns a map from player IDs to states
     */
    get_states() : Record<string,S>;

    /**
     * Update the state of player `id` to `state`.
     * @param id of the player
     * @param state to be updated to
     */
    set_player(id: string, state: S) : void;

    /**
     * Get the state of player with ID `id`.
     * @param id 
     * @returns the state of player `id`
     */
    get_player_state(id: string) : S;
}


