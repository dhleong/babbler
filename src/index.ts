import debug from "debug";

if (process.env.NODE_ENV !== "production") {
    debug.enable("babbler:*");
}

import { LicenseHandler } from "./license";
import { PlaybackHandler } from "./playback";
import { BabblerQueue } from "./queue";
import { RpcManager } from "./rpc";

// shared singleton instance
const rpc = RpcManager.create();

const context = cast.framework.CastReceiverContext.getInstance();
const playbackConfig = new cast.framework.PlaybackConfig();

const licenses = LicenseHandler.init(context, playbackConfig, rpc);
const queue = BabblerQueue.create(context, rpc);

PlaybackHandler.init(context, rpc, licenses, queue);

// tslint:disable no-bitwise
context.start({
    playbackConfig,
    queue,
    supportedCommands:
        cast.framework.messages.Command.ALL_BASIC_MEDIA
        | cast.framework.messages.Command.QUEUE_NEXT,
});
