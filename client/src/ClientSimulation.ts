import { Simulation, SimulationData } from "../../common/src/Simulation";
import { Snap } from "../../common/src/Snap";
import { EuclideanCircle } from "../../common/src/EuclideanCircle";
import { Trail, TrailData, TrailFactory } from "../../common/src/Trail";
import { State } from "../../common/src/State";
import { PhysicsFactory } from "../../common/src/PhysicsFactory";
import { EuclideanCircleSnap } from "../../common/src/EuclideanCircleSnap";
import { EuclideanStepPhysics } from "../../common/src/EuclideanStepPhysics";
import { Effector } from "../../common/src/Effector";
import { EffectorFactory } from "../../common/src/EffectorFactory";

export class ClientSimulation<S extends State> 
        extends Simulation<S> {
    /**
     * Incorporate the update into the simulation.
     * This may correct information altered by `apply_input`, effectively replacing that information.
     * @param data the data to incorporate
     */
    incorporate_update(data: SimulationData<S>): void {
        //TODO implement
        //throw new Error("Method not implemented.");
    }

    get_interpolated_player_state_at(id: string, time: number): S {
        throw new Error("Method not implemented.");
    }

    //TODO fix this super ugly hack
    private static establish_trail(data : Record<string,TrailData<EuclideanCircle>>) : Record<string,TrailData<EuclideanCircle>> {
        let trls : Record<string,TrailData<EuclideanCircle>> = {};
        for (const id of Object.keys(data)) {
            const mks : [EuclideanCircle,number][] = [];
            for (const s of data[id].recent) {
                mks.push([EuclideanCircle.establish(s[0]), s[1]]);
            }
            trls[id] = {
                recent : mks, 
                latest : [EuclideanCircle.establish(data[id].latest[0]), data[id].latest[1]]
            };
        }
        return trls;
    }
    //TODO move to factory 
    static establish(data: SimulationData<EuclideanCircle>): ClientSimulation<EuclideanCircle> {
        let trails : Record<string,Trail<EuclideanCircle>> = {};
        const est_trails = this.establish_trail(data.trails);
        const t_factory = new TrailFactory<EuclideanCircle>();
        for (const id of Object.keys(data.trails)) {
            trails[id] = t_factory.realize(est_trails[id]);
        }
        const est_effs = data.effectors.map(e => EffectorFactory.realize(e));
        return new ClientSimulation(trails, est_effs, PhysicsFactory.realize(data.physics));
    }

    /**
     * Make a snapshot for the given time of the simulation.
     * Delete data older than the given time.
     * @param time the time of the snap
     * @returns a snap of the simulation at the given time
     */
    interpolate_snap(time: number): Snap<S> {
        const trails : Record<string,EuclideanCircle> = {};
        for (const p of Object.entries(this.trails)) {
            const id = p[0];
            const stateQ = p[1];
            const state = stateQ.state_at_time(time);
            //older data is no longer used
            //stateQ.free_older_than(time); // TODO:expose
            trails[id] = (state as unknown as EuclideanCircle);
        }
        //TODO fix this generalization issue
        return new EuclideanCircleSnap(
            (this.get_physics() as unknown as EuclideanStepPhysics), 
            (this.get_effectors() as unknown as Effector<EuclideanCircle>[]), 
            trails) as unknown as Snap<S>;
    }

}
