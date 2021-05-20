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
import { Physics } from "../../common/src/Physics";

export class ClientSimulation<S extends State> 
        extends Simulation<S> {
    /**
     * Incorporate the update into the simulation.
     * This may correct information altered by `apply_input`, effectively replacing that information.
     * @param data the data to incorporate
     */
    incorporate_update(data: SimulationData<S>): void {
        this.effectors = data.effectors.map(e => EffectorFactory.realize(e) as unknown as Effector<S>);
        this.physics = PhysicsFactory.realize(data.physics) as unknown as Physics<S>;
        const new_trls = ClientSimulation.establish_trails(data.trails as unknown as Record<string,TrailData<EuclideanCircle>>);
        for (const id of Object.keys(new_trls)) {
            if (this.trails[id] == undefined) {
                this.trails[id] = new_trls[id] as unknown as Trail<S>;
            } else {
                this.trails[id].concat(new_trls[id] as unknown as Trail<S>);
            }
        }
    }

    //TODO fix this super ugly hack
    private static establish_trails(data : Record<string,TrailData<EuclideanCircle>>)
            : Record<string,Trail<EuclideanCircle>> {
        //first establish objects inside of trail
        let trls_data : Record<string,TrailData<EuclideanCircle>> = {};
        for (const id of Object.keys(data)) {
            const mks : [EuclideanCircle,number][] = [];
            for (const s of data[id].recent) {
                mks.push([EuclideanCircle.establish(s[0]), s[1]]);
            }
            trls_data[id] = {
                recent : mks, 
                latest : [EuclideanCircle.establish(data[id].latest[0]), data[id].latest[1]]
            };
        }
        //now transform traildata into trail
        let trails : Record<string,Trail<EuclideanCircle>> = {};
        const t_factory = new TrailFactory<EuclideanCircle>();
        for (const id of Object.keys(trls_data)) {
            trails[id] = t_factory.realize(trls_data[id]);
        }
        return trails;
    }
    //TODO move to factory 
    static establish(data: SimulationData<EuclideanCircle>): ClientSimulation<EuclideanCircle> {
        const est_trails = this.establish_trails(data.trails);
        const est_effs = data.effectors.map(e => EffectorFactory.realize(e));
        return new ClientSimulation(est_trails, est_effs, PhysicsFactory.realize(data.physics));
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
            trails[id] = (state as unknown as EuclideanCircle);
        }
        //TODO fix this generalization issue
        return new EuclideanCircleSnap(
            (this.get_physics() as unknown as EuclideanStepPhysics), 
            (this.get_effectors() as unknown as Effector<EuclideanCircle>[]), 
            trails) as unknown as Snap<S>;
    }

    /**
     * Get the latest state of player `id`.
     * @param id id of requested player
     * @returns latest state of this player
     */
    get_latest_player_state(id: string) : S {
        return this.trails[id].get_latest_state();
    }

    /**
     * Get the timestamp of the latest state of player `id`.
     * @param id id of requested player
     * @returns latest state time of this player
     */
    get_latest_state_time(id: string): number {
        return this.trails[id].get_latest_time()
    }

}
