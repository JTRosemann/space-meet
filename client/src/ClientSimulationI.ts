import { FullUpdateData } from "../../common/src/protocol";
import { Snap } from "./Snap";
import { SimulationI } from "./SimulationI";


export interface ClientSimulationI<S> extends SimulationI<S> {
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
    interpolate_snap(time: number): Snap<S>;

    /**
     * Returns most recent state of the player with the given ID.
     * Returns `undefined` if player doesn't exist.
     * @param id of the requested player state
     */
    get_player_state_at_time(id: string, time: number): S; //TODO use the appropriate `| null` type
}
