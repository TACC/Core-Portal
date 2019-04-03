
export default class ModalCompressCtrl {


    $onInit () {
    }

    cancel () {
        this.dismiss();
    }

    appendZipExtension(filename) {
        if (filename.toLowerCase().endsWith(".zip")) {
            return filename;
        }
        return filename + ".zip";
    }

    doCompressFile () {
        this.close({ $value: {
            destination: this.appendZipExtension(this.targetName) }
        });
    }
}
