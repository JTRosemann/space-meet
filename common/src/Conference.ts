
export class Conference {
    static establish(conf: Conference) {
        return new this(conf.conf_id, conf.call_ids);
    }

    conf_id: string;
    call_ids: Record<string,string> = {};

    constructor(id: string, call_ids: Record<string,string> = {}) {
        this.conf_id = id;
        this.call_ids = call_ids;
    }

    get_sid_from_cid(cid: string) {
        for (const e of Object.entries(this.call_ids)) {
            if (e[1] == cid) {
                return e[0];
            }
        }
        return undefined;
    }

    init_panners(audio_ctx: AudioContext) : Record<string,PannerNode> {
        const ret : Record<string,PannerNode> = {};
        for (const k of Object.keys(this.call_ids)) {
            ret[k] = new PannerNode(audio_ctx);
        }
        return ret;
    }
}
