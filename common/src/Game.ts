import { Item } from "./game.core";
import { RectangleWorld, World } from "./World";

/* TODO outsource the simulation
interface Simulation {

}
*/
/**
    The game_core class
*/

export class Game {
    id: string;
    world: World = new RectangleWorld(720, 480);
    items: Item[] = [];

    constructor(id: string) {
        this.id = id;
    }

}
