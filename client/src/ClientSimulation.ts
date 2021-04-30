import { Simulation, SimulationData } from "../../common/src/Simulation";
import { Snap } from "../../common/src/Snap";
import { EuclideanCircle } from "../../common/src/EuclideanCircle";
import { Trail } from "../../common/src/Trail";
import { RecSnap } from "./RecSnap";
import { State } from "../../common/src/State";

export class ClientSimulation<S extends State> 
        extends Simulation<S> {
    /**
     * Incorporate the update into the simulation.
     * This may correct information altered by `apply_input`, effectively replacing that information.
     * @param data the data to incorporate
     */
    incorporate_update(data: SimulationData<S>): void {
        throw new Error("Method not implemented.");
    }

    get_interpolated_player_state_at(id: string, time: number): S {
        throw new Error("Method not implemented.");
    }

    private players: Record<string, Trail<S>>;

    //TODO move to factory ?
    static establish(data: SimulationData<EuclideanCircle>): ClientSimulation<EuclideanCircle> {
        throw new Error("Method not implemented.");
    }

    /**
     * Make a snapshot for the given time of the simulation.
     * Delete data older than the given time.
     * @param time the time of the snap
     * @returns a snap of the simulation at the given time
     */
    interpolate_snap(time: number): Snap<S> {
        let res = new RecSnap<S>();
        for (const p of Object.entries(this.players)) {
            const id = p[0];
            const stateQ = p[1];
            const state = stateQ.state_at_time(time);
            //older data is no longer used
            //stateQ.free_older_than(time); // TODO:expose
            res.set_player(id, state);
        }
        return res;
    }

    /**
     * Return the state of the player `id` at `time`.
     * @param id of the player requested
     * @param time time to observe
     * @returns the state of the player with `id` at `time`
     */
    get_last_fixed_player_state_before(id: string, time: number): S {
        return this.players[id].state_at_time(time);
    }

}
