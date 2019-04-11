import debug from "debug";

if (process.env.NODE_ENV !== "production") {
    debug.enable("babbler:*");
}

import { LicenseHandler } from "./license";
import { PlaybackHandler } from "./playback";
import { RpcManager } from "./rpc";

// shared singleton instance
const rpc = RpcManager.create();

const context = cast.framework.CastReceiverContext.getInstance();
const playbackConfig = new cast.framework.PlaybackConfig();

LicenseHandler.init(rpc, playbackConfig, context);
PlaybackHandler.init(context);

context.start({
    playbackConfig,
    supportedCommands: cast.framework.messages.Command.ALL_BASIC_MEDIA,
});
