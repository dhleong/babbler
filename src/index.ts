import debug from "debug";

if (process.env.NODE_ENV !== "production") {
    debug.enable("babbler:*");
}

import { RpcManager } from "./rpc";

// shared singleton instance
export const rpc = RpcManager.create();
