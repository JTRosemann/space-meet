import { FullUpdateData } from "../../common/src/protocol";
import { InterpretedInput } from "./InterpretedInput";
import { Snap } from "./Snap";

/**
 * The client Simulation keeps information on different timestamps to interpolate between them.
 * It automatically removes old information at some point.
 * Only for the most recent information there is a guarantee, that it won't be removed:
 * Accesses to older information may result in just returning the most recent information.
 */
export interface Simulation<S> {
    /**
     * Incorporate the update into the simulation.
     * This may correct information altered by `apply_input`, effectively replacing that information.
     * @param data the data to incorporate
     */
    incorporate_update(data: FullUpdateData): void; //TODO fix type

    /** 
     * Interpolate the snap at the given time.
     * @param time the point in time that we want to simulate.
     */
    interpolate_snap(time: number) : Snap<S>;

    /**
     * Returns most recent state of the player with the given ID.
     * Returns `undefined` if player doesn't exist.
     * @param id of the requested player state
     */
    get_player_state_at_time(id: string, time: number) : S; //TODO use the appropriate `| null` type
}
