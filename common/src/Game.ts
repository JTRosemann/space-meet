import { State } from "./State";
import { Item } from "./Item";
import { InputPlayer } from "./InputPlayer";
import { vec } from "./vec";
import { RectangleWorld } from "./World";


export function establish_item(it: Item) {
    return {
        id: it.id,
        state: State.establish({x: it.state.pos.x, y: it.state.pos.y, d: it.state.dir}),
        rad: it.rad
    };
}
/**
    The game_core class
*/
export class Game {
    static establish(game: Game) {
        return new this(game.id, 
            RectangleWorld.establish(game.world), 
            game.items.map(establish_item),
            game.podiums.map(establish_item),
            game.tables.map(establish_item));
    }

    id: string;
    world: RectangleWorld;
    items: Item[];
    podiums: Item[];
    tables: Item[];

    constructor(id: string, 
                world = new RectangleWorld(720, 480), 
                items: Item[] = [], 
                podiums: Item[] = [],
                tables: Item[] = []) {
        this.id = id;
        this.world = world;
        this.items = items;
        this.podiums = podiums;
        this.tables = tables;
    }

    on_podium(pos: vec) {
        for (const pod of this.podiums) {
            if (pod.state.pos.sub(pos).abs() < pod.rad) {
                return true;
            }
        }
        return false;
    }

    at_table(pos: vec) {
        for (const tab of this.tables) {
            if (tab.state.pos.sub(pos).abs() < tab.rad) {
                return tab.id;
            }
        }
        return '';
    }

    get_item(id: string) {
        for (const it of this.items) {
            if (it.id == id) {
                return it;
            }
        }
        throw Error('Item ' + id + ' not found');
    }

    push_item(it: Item) {
        for (const i of this.items) {
            if (i.id == it.id) {
                return;
            }
        }
        this.items.push(it);
    }

    rm_item(id: string) {
        this.items = this.items.filter((it: Item) => id != it.id);
    }
    
    set_items(items: Item[]) : void {
        this.items = items;
    }
    
    get_items() : Item[] {
        return this.items;
    }

    get_item_state(id: string) : State {
        for (const it of this.items) {
            if (it.id == id) {
                return it.state;
            }
        }
    }
    
    get_item_rad(id: string) {
        for (const it of this.items) {
            if (it.id == id) {
                return it.rad;
            }
        }        
    }

    get_item_facing(id: string) {
        return new vec(Math.cos(this.get_item_state(id).dir), 
                       Math.sin(this.get_item_state(id).dir));
    }

    set_item_state(id: string, state: State) {
        for (const it of this.items) {
            if (it.id == id) {
                it.state = state;
                it.state = this.world.confine(it);//the world has the last say
                return;
            }
        }
        this.items.push({id: id, state: state, rad: InputPlayer.std_rad});
        console.warn('set_item_state: id ' + id + ' not found.');
    }
}
