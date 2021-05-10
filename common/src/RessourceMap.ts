import { Conference } from "./Conference";

export type VideoMap = Record<string,string>;

export class RessourceMap {
    static establish(res_map: RessourceMap) : RessourceMap {
        return new RessourceMap(Conference.establish(res_map.conf), res_map.vid_map);
    }

    private conf: Conference;
    private vid_map: VideoMap;

    constructor(conf: Conference, vid_map: VideoMap) {
        this.conf = conf;
        this.vid_map = vid_map;
    }

    get_conf(): Conference {
        return this.conf;
    }

    set_call_id(p_id: string, c_id: string) {
        this.conf.set_call_id(p_id, c_id);
    }

    rm_player(id: string) {
        this.conf.rm_player(id);
        if (this.vid_map[id]) {
            delete this.vid_map[id];
        }
    }
    
    get_vid_map(): VideoMap {
        return this.vid_map;
    }

}
