import FileListingCtrl from './file-listing.controller';

const fileListingComponent = {
    template: require("./file-listing.template.html"),
    bindings: {
        params: '<',
    },
    controller: FileListingCtrl,
};
export default fileListingComponent;
