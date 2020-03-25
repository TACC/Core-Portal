export default class ModalMakeDirCtrl {

    $onInit () {
        this.folderName = 'Untitled Folder';
    }

    doCreateFolder () {
        this.close(
            { $value: this.folderName }
        );
    }

    cancel () {
        this.dismiss();
    }

}
