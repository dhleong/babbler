import { LICENSE } from "./messages";
import { RpcManager } from "./rpc";
import { ab2str } from "./util";

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

        playbackConfig.licenseRequestHandler = handler.handleLicenseRequest.bind(handler);

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

    public handleLicenseRequest(
        requestInfo: cast.framework.NetworkRequestInfo,
    ) {
        const originalUrl = requestInfo.url;
        if (!/^ipc:\/\//.test(originalUrl)) {
            // just allow the default behavior
            return null;
        }

        // route through IPC
        const dataBase64 = btoa(ab2str(requestInfo.content));
        requestInfo.url = "data://application/json," + JSON.stringify({
            data: dataBase64,
            url: originalUrl.substring("ipc://".length),
        });
    }

    public async handleLicenseData(data: ArrayBuffer) {
        const asString = ab2str(data);

        let obj;
        try {
            obj = JSON.parse(asString);
        } catch (e) {
            // not JSON? return original response data unmolested
            return data;
        }

        const buffer = await this.rpc.send(LICENSE, {
            base64: obj.data,
            url: obj.url,
        });

        return { buffer };
    }

    public start() {
        this.context.start({
            playbackConfig: this.playbackConfig,
            supportedCommands: cast.framework.messages.Command.ALL_BASIC_MEDIA,
        });
    }
}
