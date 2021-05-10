
/**
 * This class represents a Jitsi Conference.
 * It has an id and a table that associates player ids with their call ids.
 */
export class Conference {
    static establish(conf: Conference) {
        return new this(conf.conf_id, conf.call_ids);
    }

    private conf_id: string;
    private call_ids: Record<string,string> = {};

    constructor(id: string, call_ids: Record<string,string> = {}) {
        this.conf_id = id;
        this.call_ids = call_ids;
    }

    /**
     * Get the call_id associated with the given socket.io id.
     * @param sid socket.io id
     * @returns the corresponding call_id or undefined if non-existent
     */
    get_cid(sid: string) {
        return this.call_ids[sid];
    }

    /**
     * Get the socket.io ID associated with the given call_id.
     * If there are several, one of them is chosen.
     * @param cid call_id
     * @returns the corresponding socket.io ID or undefined if non-existent
     */
    get_sid(cid: string) {
        for (const e of Object.entries(this.call_ids)) {
            if (e[1] == cid) {
                return e[0];
            }
        }
        return undefined;
    }

    /**
     * Set call_id of `sid` to `cid`.
     * @param sid socket.io ID
     * @param cid call_id
     */
    set_call_id(sid: string, cid: string) {
        this.call_ids[sid] = cid;
    }

    /**
     * Getter for the ID of the conference.
     * @returns the ID of the conference
     */
    get_conf_id() {
        return this.conf_id;
    }

    /**
     * Remove the call_id of player `id`.
     * @param id 
     */
    rm_player(id: string) {
        delete this.call_ids[id];
    }
}
