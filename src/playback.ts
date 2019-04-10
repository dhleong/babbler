import { RequestType } from "./messages";
import { RpcManager } from "./rpc";

export class PlaybackHandler {
    public static init(
        rpc: RpcManager,
        context: cast.framework.CastReceiverContext =
            cast.framework.CastReceiverContext.getInstance(),
        playbackConfig: cast.framework.PlaybackConfig =
            new cast.framework.PlaybackConfig(),
    ) {
        const handler = new PlaybackHandler(
            rpc,
            context,
            playbackConfig,
        );

        // NOTE: the typings don't allow for a promise, but the API does
        playbackConfig.licenseHandler = handler.handleLicenseData.bind(handler) as any;

        handler.start();
        return handler;
    }

    constructor(
        private rpc: RpcManager,
        private context: cast.framework.CastReceiverContext,
        private playbackConfig: cast.framework.PlaybackConfig,
    ) {}

    public async handleLicenseData(data: ArrayBuffer) {
        // TODO
        await this.rpc.send(RequestType.LICENSE, {});
        return { buffer: data };
    }

    public start() {
        this.context.start({
            playbackConfig: this.playbackConfig,
        });
    }
}
