import { InputObj, InputProcessor, Item, physics_movement_vector_from_direction, process_inputs } from "./game.core";

/**
 * A Controller controls one item. It is called to update its item in every simulation iteration.
 * Implementations of a Controller may have access to additional information to update the controllee.
 * But they should not modify anything beyond their own controllee. (Maybe use Readonly?)
 */
export interface Controller {
    controllee: Item;
    update(delta_time: number, now_time: number): void; //TODO this function will need additional arguments (time etc.)
}


