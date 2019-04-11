export interface ILicenseService {
    performRequest(challenge: Buffer): Promise<Buffer>;
}
