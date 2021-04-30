import { EuclideanStepPhysics } from "./EuclideanStepPhysics";

export interface PhysicsData {
    mv_speed : number;
    trn_speed : number;
    width : number;
    height : number;
}

export class PhysicsFactory {

    static realize(data : PhysicsData) {
        // as soon as there are more physics models, we need to make a case distinction here
        return this.create_euclidean_step_physics(data);
    }

    static create_euclidean_step_physics(data : PhysicsData) : EuclideanStepPhysics {
        return new EuclideanStepPhysics(data.mv_speed, data.trn_speed, data.width, data.height);
    }

}
