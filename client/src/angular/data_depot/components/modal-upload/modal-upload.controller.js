import _ from 'underscore';

export default class ModalUpload {
    constructor($q, Modernizr) {
        'ngInject';
        this.$q = $q;
        this.Modernizr = Modernizr;
    }

    $onInit() {
        this.directoryUpload = this.resolve.directoryUpload;
        this.currentState = this.resolve.currentState;
        this.uploads = [];
        this.uploading = false;
        this.retry = false;
        this.directoryUploadSupported = this.Modernizr.fileinputdirectory;
    }

    filesSelected (files) {
        _.each(files, (f)=> {
            this.uploads.push({
                file: f,
                state: 'pending',
                promise: null
            });
        });
    }

    upload() {
        this.uploading = true;
        var tasks = _.map(this.uploads, (upload) => {
            upload.state = 'uploading';
            let formData = new FormData();
            formData.append('file', upload.file);
            if (upload.file.webkitRelativePath) {
                formData.append('relative_path', upload.file.webkitRelativePath);
            }
            return this.currentState.listing.upload(formData).then(
                (resp)=> {
                    upload.state = 'success';
                    return {
                        status: 'success',
                        response: resp
                    };
                },
                (err)=> {
                    upload.state = 'error';
                    upload.error = err.data;
                    return {
                        status: 'error',
                        response: err.data
                    };
                }
            );
        });
        this.$q.all(tasks).then((results) => {
            this.uploading = false;
            this.currentState.busy = true;
            this.currentState.listing.fetch().then(()=> {
                this.currentState.busy = false;
                if (this.currentState.project) {
                    this.currentState.ui.tagFiles = true;
                    this.tagFiles = true;
                }
            });

            var errors = _.filter(results, (result)=> {
                return result.status === 'error';
            });

            if (errors.length > 0) {
                // oh noes...give the user another chance with any errors
                this.retry = true;
            } else {
                // it's all good; close the modal
                if (!this.currentState.project) {
                    this.close();
                }
            }
        });
    }

    retry() {
        this.uploads = _.where(this.uploads, {
            state: 'error'
        });
        this.upload();
        this.retry = false;
    }

    /**
     * Remove an upload from the list of staged uploads.
     *
     * @param index
     */
    removeUpload(index) {
        this.uploads.splice(index, 1);
    }

    /**
     * Clear all staged uploads.
     */
    reset() {
        this.uploads = [];
    }

    /**
     * Cancel and close upload dialog.
     */
    cancel() {
        this.dismiss();
    }
}
