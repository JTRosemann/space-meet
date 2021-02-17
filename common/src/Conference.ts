
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
}
