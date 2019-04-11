
export function ab2str(buf: ArrayBuffer) {
    return String.fromCharCode.apply(null, new Uint8Array(buf) as any);
}

export function str2ab(str: string) {
    return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}
