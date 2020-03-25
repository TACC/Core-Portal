
export default class ModalRenameCtrl {


    $onInit () {
        this.file = this.resolve.file;
        this.targetName = this.file.name;
    }

    cancel () {
        this.dismiss();
    }

    doRenameFile () {
        this.close({ $value: {
            file: this.file, renameTo: this.targetName }
        });
    }
}
