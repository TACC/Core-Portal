
export default class ModalCompressCtrl {
    constructor() {
        this.compressionType = "zip";
    }

    $onInit () {
        this.targzSupport = this.resolve.targzSupport;
        if (this.resolve.targetName) {
            this.targetName = this.resolve.targetName;
        }
    }

    cancel () {
        this.dismiss();
    }

    appendExtension(filename) {
        let extension = this.compressionType;
        if (extension === "tgz") {
            extension = "tar.gz";
        }
        extension = "." + extension;
        if (filename.toLowerCase().endsWith(extension)) {
            return filename;
        }
        return filename + extension;
    }

    doCompressFile () {
        this.close(
            {
                $value: {
                    destination: this.appendExtension(this.targetName),
                    compressionType: this.compressionType
                }
            }
        );
    }
}
