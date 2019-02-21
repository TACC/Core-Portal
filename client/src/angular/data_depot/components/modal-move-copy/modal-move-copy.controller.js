import _ from 'underscore';

export default class ModalMoveCopyCtrl {
    constructor(FileListing, SystemsService, ProjectService) {
        'ngInject';
        this.FileListing = FileListing;
        this.SystemsService = SystemsService;
        this.ProjectService = ProjectService;
    }

    $onInit() {
        this.files = this.resolve.files;
        this.action = this.resolve.action;
        this.busy = false;
        this.error= null;
        this.listingProjects= false;
        this.breadCrumbParams = {
            filePath: '',
            systemId: '',
        };
        this.currentOption = null;
        this.systems = this.SystemsService.systems;
        this.myDataSystem = _.find(this.systems, {
            name: 'My Data'
        });

        this.options = [
            { label: 'My Data' },
            { label: 'My Projects' }
        ];
        this.currentOption = this.options[0];
        this.optionChange();
    }

    optionChange () {
        this.busy = true;
        if (this.currentOption.label === 'My Data') {
            this.selectMyData();
        } else {
            this.selectMyProjects();
        }
    }

    selectMyData () {
        this.apiParams = {
            fileMgr: 'my-data',
            baseUrl: '/api/data-depot/files'
        };
        let conf = {
            system: this.myDataSystem.systemId, path: ''
        };
        this.breadCrumbParams = {
            filePath: '',
            systemId: this.myDataSystem.systemId,
            customRoot: { name: 'My Data', path: '' }
        };
        this.project = null;
        this.listingProjects = false;
        this.FileListing.get(conf, this.apiParams)
            .then((listing)=> {
                this.listing = listing;
                this.breadCrumbParams.filePath = this.listing.path;
            })
            .finally(()=>{
                this.busy = false;
            });
    }

    selectMyProjects() {
        this.project = null;
        this.apiParams = {
            fileMgr: 'shared',
            baseUrl: '/api/data-depot/files'
        };
        this.breadCrumbParams = {
            filePath: '',
            systemId: '',
            skipPath: true,
            customRoot: { name: '', path: '' }
        };
        this.project = true;
        this.listingProjects = true;
        this.ProjectService.list()
            .then((projects)=> {
                this.projects = projects;
            })
            .finally(()=>{
                this.busy = false;
            });
    }

    browseProject(ev, project) {
        this.listingProjects = false;
        this.project = project;
        this.breadCrumbParams = {
            filePath: '/',
            systemId: this.project.id,
            customRoot: { name: project.name || project.description, path: '' }
        };
        this.busy = true;
        this.FileListing.get({ system: project.id, path: '' }, this.apiParams)
            .then((listing)=> {
                this.listing = listing;
            })
            .finally(()=>{
                this.busy = false;
            });
    }

    onBrowse ($event, fileListing) {
        $event.preventDefault();
        $event.stopPropagation();
        this.listingProjects = false;
        this.busy = true;
        this.FileListing.get({ system: fileListing.system, path: fileListing.path }, this.apiParams)
            .then((listing)=> {
                this.listing = listing;
                this.breadCrumbParams.filePath = this.listing.path;
            })
            .finally(()=>{
                this.busy = false;
            });
    }

    validDestination (fileListing) {
        return fileListing &&
            !this.busy &&
            (fileListing.type === 'dir' || fileListing.type === 'folder') &&
            fileListing.permissions &&
            (fileListing.permissions === 'ALL' || fileListing.permissions.indexOf('WRITE') > -1);
    }

    chooseDestination (fileListing) {
        this.close(
            { $value:
                 { target: fileListing }
            }
        );
    }

    cancel () {
        this.dismiss();
    }

}
