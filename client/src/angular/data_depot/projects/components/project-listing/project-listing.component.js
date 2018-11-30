import ProjectListingCtrl from './project-listing.controller';

const projectListingComponent = {
    template: require("./project-listing.template.html"),
    bindings: {
        params: '<',
    },
    controller: ProjectListingCtrl,
};
export default projectListingComponent;
