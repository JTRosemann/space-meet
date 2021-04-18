import { FullUpdateData } from "../../common/src/protocol";
import { SimulationI } from "./SimulationI";
import { Simulation } from "./Simulation";
import { ClientSimulationI } from "./ClientSimulationI";
import { Snap } from "./Snap";
import { EuclideanCircle } from "./EuclideanCircle";
import { InterpolationQueue } from "./InterpolationQueue";
import { RecSnap } from "./RecSnap";

export class SimulationC 
        extends Simulation<EuclideanCircle> 
        implements ClientSimulationI<EuclideanCircle> {

    private players: Record<string, InterpolationQueue<EuclideanCircle>>;

    static establish(data: FullUpdateData): SimulationC {
        throw new Error("Method not implemented.");
    }

    /**
     * Make a snapshot for the given time of the simulation.
     * Delete data older than the given time.
     * @param time the time of the snap
     * @returns a snap of the simulation at the given time
     */
    interpolate_snap(time: number): Snap<EuclideanCircle> {
        let res = new RecSnap<EuclideanCircle>();
        for (const p of Object.entries(this.players)) {
            const id = p[0];
            const stateQ = p[1];
            const state = stateQ.state_at_time(time);
            //older data is no longer used
            stateQ.free_older_than(time); // TODO:expose
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
    get_player_state_at_time(id: string, time: number): EuclideanCircle {
        return this.players[id].state_at_time(time);
    }

    incorporate_update(data: FullUpdateData) {
        throw new Error("Method not implemented.");
    }

}
