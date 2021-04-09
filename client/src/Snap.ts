
export interface Snap<S> {
    set_player(viewer_id: string, predict_me: S) : void;
    get_player_state(viewer_id: string) : S;
}


