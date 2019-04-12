import debug_ from "debug";
const debug = debug_("babbler:playback");

import { IPlayerManagerEx } from "chromecast-caf-receiver/cast.framework";
import { LicenseHandler } from "./license";

// TODO do some debouncing instead of just guessing like this...?
const EXPECTED_LICENSE_REQUESTS = 4;

const DELAY = 2000;

enum HangFixState {
    NO_HANG,
    FIX_ENQUEUED,
    FIX_ATTEMPTED,
    FIX_ERRORED,

    FIX_ERRORED_RESOLVING,
}

export class PlaybackHandler {
    public static init(
        context: cast.framework.CastReceiverContext,
        licenses: LicenseHandler,
    ) {
        const playerManager = context.getPlayerManager();

        const handler = new PlaybackHandler(
            playerManager,
        );

        if (process.env.NODE_ENV !== "production") {
            playerManager.addEventListener(
                cast.framework.events.category.CORE,
                event => { debug("EVENT", event); },
            );
        }

        // we may be interested in error events:
        playerManager.addEventListener(
            cast.framework.events.EventType.ERROR,
            event => handler.dispatchErrorEvent(
                event as cast.framework.events.ErrorEvent,
            ),
        );

        // gross, but necessary due to incomplete typings:
        const pmEx = playerManager as unknown as IPlayerManagerEx;
        pmEx.setMessageInterceptor(
            cast.framework.messages.MessageType.LOAD,
            handler.interceptLoadMessage.bind(handler),
        );

        playerManager.setMediaPlaybackInfoHandler(
            handler.handleMediaPlaybackInfo.bind(handler),
        );

        // this is not the best way to deal with this, but even after
        // getting all license requests answered successfully sometimes
        // the player hangs; this hook lets us try to resolve that:
        licenses.addEventListener("LICENSE_RESPONSE", () => {
            handler.onLicenseResponseReceived();
        });

        return handler;
    }

    private licenseResponsesReceived = 0;
    private hangFixState: HangFixState = HangFixState.NO_HANG;

    constructor(
        private playerManager: cast.framework.PlayerManager,
    ) {}

    public async interceptLoadMessage(
        loadRequestData: cast.framework.messages.LoadRequestData,
    ) {
        debug("new LOAD request received");

        // reset state for new media
        this.licenseResponsesReceived = 0;
        this.hangFixState = HangFixState.NO_HANG;

        if (loadRequestData.media && loadRequestData.media.contentId) {
            loadRequestData.media.contentId = loadRequestData.media.contentId.replace(/^http[s]?:/, "");
        }

        return loadRequestData;
    }

    public handleMediaPlaybackInfo(
        loadRequest: cast.framework.messages.LoadRequestData,
        playbackConfig: cast.framework.PlaybackConfig,
    ) {
        if (loadRequest.customData && loadRequest.customData.license) {
            const { license } = loadRequest.customData;
            if (license.url) {
                playbackConfig.licenseUrl = license.url;
            }

            if (license.ipc) {
                const licenseUrl = playbackConfig.licenseUrl || "";
                const uri = "ipc://" + encodeURIComponent(licenseUrl);
                playbackConfig.licenseUrl = uri;
            }
        }

        (playbackConfig as any).shakaConfig = {
            // hacks to force widevine loading:
            manifest: {
                dash: {
                    ignoreDrmInfo: true,
                },
            },
        };

        // hacks for local testing:
        if (process.env.NODE_ENV !== "production") {
            (playbackConfig as any).shakaConfig.drm = {
                advanced: {
                    "com.widevine.alpha": {
                        audioRobustness: "",
                        videoRobustness: "",
                    },
                },
            };
        }

        return playbackConfig;
    }

    public onLicenseResponseReceived() {
        const received = ++this.licenseResponsesReceived;
        if (
            this.hangFixState !== HangFixState.NO_HANG
            || received < EXPECTED_LICENSE_REQUESTS
        ) {
            return;
        }

        this.hangFixState = HangFixState.FIX_ENQUEUED;

        setTimeout(() => {
            switch (this.playerManager.getPlayerState()) {
            case "BUFFERING":
                debug("attempt to fix hang");

                this.hangFixState = HangFixState.FIX_ATTEMPTED;
                this.playerManager.play();
                break;

            case "PLAYING":
                this.hangFixState = HangFixState.NO_HANG;
                break;
            }
        }, DELAY);
    }

    public dispatchErrorEvent(error: cast.framework.events.ErrorEvent) {
        debug(
            "error event #", error.detailedErrorCode,
            "hangFixState=", this.hangFixState,
        );

        // sigh:
        const errorCode = error.detailedErrorCode as unknown as number;

        if (
            this.hangFixState === HangFixState.FIX_ATTEMPTED
                && errorCode === 906
        ) {
            this.hangFixState = HangFixState.FIX_ERRORED;
            const state = this.playerManager.getPlayerState();
            if (state === "PLAYING") {
                this.hangFixState = HangFixState.NO_HANG; // FIXED
                debug("fixed hang");
                return;
            }

            // media error message; we tried to force playback
            // but it wasn't ready... I guess?
            this.playerManager.pause();
            this.hangFixState = HangFixState.FIX_ERRORED_RESOLVING;

            debug(
                "failed to force playback... try again; state=",
                state,
            );

            setTimeout(() => {
                const newState = this.playerManager.getPlayerState();
                if (newState === "PAUSED") {
                    debug("resolve hangfix error; state=", state);
                    this.playerManager.play();
                } else {
                    debug("unable to resolve hangfix error; state=", state);
                }
            }, DELAY);
        }
    }
}
