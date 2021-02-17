
export class Conference {
    conf_id: string;
    call_ids: Record<string,string> = {};

    constructor(id: string) {
        this.conf_id = id;
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
