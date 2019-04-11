import * as cast from "chromecast-caf-receiver";

// satisfy the compiler:
export { cast };

type Categories = cast.framework.events.EventType[];

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

enum EventTypes {
    MEDIA_STATUS = "MEDIA_STATUS",
}

declare global {
    namespace cast {
        namespace framework {
            namespace events {
                namespace category {
                    export const CORE: Categories;
                }

                export const EventType: typeof EventTypes;
            }

            namespace messages {
                export const Command: typeof Commands;
            }
        }
    }
}
