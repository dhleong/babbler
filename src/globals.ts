import * as cast from "chromecast-caf-receiver";

// satisfy the compiler:
export { cast };

enum Commands {
    PAUSE,
    SEEK,
    STREAM_VOLUME,
    STREAM_MUTE,
    ALL_BASIC_MEDIA,
    QUEUE_NEXT,
    QUEUE_PREV,
    QUEUE_SHUFFLE,
    SKIP_AD,
}

declare global {
    namespace cast {
        namespace framework {
            namespace messages {
                export const Command: typeof Commands;
            }
        }
    }
}
