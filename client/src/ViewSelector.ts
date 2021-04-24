import { SimulationI } from "../../common/src/SimulationI";
import { ClientSimulationI } from "./ClientSimulationI";
import { Snap } from "../../common/src/Snap";
import { InterpretedInput } from "../../common/src/InterpretedInput";
import { EuclideanCircle } from "../../common/src/EuclideanCircle";

/**
 * This class is responsible for producing the snapshot of the simulation,
 * that is to be rendered.
 * This includes interpolating the correct position at a given time for all players
 * and predicting the position of the cllient-controlled player according to the inputs,
 * as well as emitting the inputs to the server using the input processor.
 * Here only geometric information is handled - not the respective media.
 */
export class ViewSelector<S> {
    private simulation: ClientSimulationI<S>;
    private viewer_id: string;

    constructor(simulation: ClientSimulationI<S>, viewer_id: string) {
        this.simulation = simulation;
        this.viewer_id = viewer_id;
    }

    //Q: (A) apply inputs in simulation on client. 
    //       advantage: don't have to apply inputs several times
    //       NOT possible: for representation we only fetch the most recent data from self, relative inputs on wrong assumed state would stick on top and be used for further inputs
    //or (B) keep input queue and apply all inputs newer than most recent server update. advantage: no clash between server_updates & inputs
    //A: B is the way to go

    /**
     * Register inputs for client prediction.
     * @param input to register for client prediction
     */
    register_input(input: InterpretedInput<S>, server_time: number) : void {
        //TODO: implement
    }

    /**
     * Replay inputs that are more recent than the given state and return the resulting state.
     * @param state start state to replay inputs on
     * @returns the resulting state
     */
    private replay_inputs(state: S) : S {
        //TODO: implement
        return state;
    }

    /**
     * Select a view of the simulation:
     * For all other players the position they had at now - tbuf is interpolated,
     * using the server data.
     * For the controlling player the last server update is used.
     * All inputs that are newer than that update are played upon it.
     * @param tbuf the time difference in ms between now and the view to be rendered
     * @returns the smoothened & client-predicted snap
     */
    select_view(tbuf: number): Snap<S> {
        // make a snap `tbuf` ms in the past
        const snap = this.simulation.interpolate_snap(tbuf);
        // update the **current** state of this player with read inputs
        // Q: what is "current" ?
        // FIXME:
        const now = 0;
        const curr_state = this.simulation.get_last_fixed_player_state_before(this.viewer_id, now);
        const predict_me = this.replay_inputs(curr_state);
        snap.set_player(this.viewer_id, predict_me);
        // return smoothened & predicted snap
        return snap;
    }
}
