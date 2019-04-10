import debug from "debug";

if (process.env.NODE_ENV !== "production") {
    debug.enable("babbler:*");
}

import { PlaybackHandler } from "./playback";
import { RpcManager } from "./rpc";

// shared singleton instance
export const rpc = RpcManager.create();

PlaybackHandler.init(rpc);
