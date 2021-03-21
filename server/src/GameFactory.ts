import * as UUID from 'uuid';
import { Game } from '../../common/src/Game';
import { vec } from '../../common/src/vec';
import { RectangleWorld } from '../../common/src/World';
import { State } from '../../common/src/State';
import { Item } from '../../common/src/Item';

export class GameFactory {
    static std_mv_speed = 120;
    static std_trn_speed = 1;
    static std_rad = 16;
    static std_step = 4;

    static create_podium_game(): Game {
        const p = { state: new State(new vec(300, 160), 0), rad: 64, id: 'podium' };
        const g = new Game(UUID.v4(), GameFactory.std_rad, GameFactory.std_mv_speed, GameFactory.std_trn_speed, GameFactory.std_step, new RectangleWorld(480, 320), [], [p]);
        return g;
    }

    static create_tables_game(n: number): Game {
        const table_rad = 64;
        const rad = 200;
        const center_x = 2 * rad;
        const center_y = 2 * rad;
        const width = 2 * center_x;
        const height = 2 * center_y;
        const p = { state: new State(new vec(center_x, center_y), 0), rad: 64, id: 'podium' };
        let tables: Item[] = [];
        let podiums: Item[] = [p];
        const seg = 2 * Math.PI / n; //angle between tables
        for (let i = 0; i < n; i++) {
            const x = Math.cos(i * seg) * rad + center_x;
            const y = Math.sin(i * seg) * rad + center_y;
            const state = new State(new vec(x, y), 0);
            const id_tab = 'table' + i;
            const id_pod = 'podium' + i;
            tables.push({ state: state, rad: table_rad, id: id_tab });
            podiums.push({ state: state, rad: table_rad / 3, id: id_pod });
        }
        const g = new Game(UUID.v4(), GameFactory.std_rad, GameFactory.std_mv_speed, GameFactory.std_trn_speed, GameFactory.std_step, new RectangleWorld(width, height), [], podiums, tables);
        return g;
    }
}
