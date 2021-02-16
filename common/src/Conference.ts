
export class Conference {
    conf_id: string;
    call_ids: Record<string,string> = {};

    constructor(id: string) {
        this.conf_id = id;
    }
}
