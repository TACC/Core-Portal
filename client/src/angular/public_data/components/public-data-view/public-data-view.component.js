import PublicDataViewCtrl from './public-data-view.controller';
import publicDataViewTemplate from './public-data-view.template.html';

const publicDataViewComponent = {
    template: publicDataViewTemplate,
    controller: PublicDataViewCtrl,
    bindings: {
        systems: '<'
    }
};
export default publicDataViewComponent;