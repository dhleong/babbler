import { ILicenseService } from "./service";

export class Engine {
    constructor(private service: ILicenseService) {}

    public foo(b: Buffer) {
        this.service.performRequest(b);
    }
}
