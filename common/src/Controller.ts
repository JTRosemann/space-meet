
/**
 * A Controller controls one item. It is called to update its item in every simulation iteration.
 * Implementations of a Controller may have access to additional information to update the controllee.
 * But they should not modify anything beyond their own controllee. (Maybe use Readonly?)
 */
export interface Controller {
    update(delta_time: number, now_time: number): void; //TODO this function will need additional arguments (time etc.)
}