import FileListingCtrl from './file-listing.controller';

const fileListingComponent = {
    template: require("./file-listing.template.html"),
    bindings: {
        params: '<',
        onBrowse: '&'
    },
    controller: FileListingCtrl,
};
export default fileListingComponent;
