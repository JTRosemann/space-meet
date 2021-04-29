import * as UUID from 'uuid';
import { EuclideanCircle } from '../../common/src/EuclideanCircle';
import { EuclidianCircleSnap } from '../../common/src/EuclideanCircleSnap';
import { ServerSimulation } from './ServerSimulation';

export class GameFactory {
    static std_mv_speed = 7; //TODO: what unit?
    static std_trn_speed = 1;//TODO: what unit?
    static std_rad = 0.5;// ~ in meters
    static std_step = 0.25;

    static create_podium_game(): ServerSimulation<EuclideanCircle> {
        //const p = { state: new State(new vec(10, 5), 0), rad: 2, id: 'podium' };
        //const g = new Game(UUID.v4(), GameFactory.std_rad, GameFactory.std_mv_speed, GameFactory.std_trn_speed, GameFactory.std_step, new RectangleWorld(15, 10), [], [p]);
        //return g;
        throw new Error("Methond not implemented.");
    }

    static create_tables_game(n: number): EuclidianCircleSnap {
        /*const table_rad = 2;
        const rad = 8;
        const center_x = 2 * rad;
        const center_y = 2 * rad;
        const width = 2 * center_x;
        const height = 2 * center_y;
        const p = { state: new State(new vec(center_x, center_y), 0), rad: 2, id: 'podium' };
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
        */
        throw new Error("Method not implemented.");
    }
}
