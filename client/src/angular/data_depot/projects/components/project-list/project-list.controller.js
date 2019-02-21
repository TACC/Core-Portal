
class ProjectListCtrl {
    constructor($scope, $state, ProjectService, $uibModal) {
        'ngInject';
        this.$state = $state;
        this.ProjectService = ProjectService;
        this.$uibModal = $uibModal;
    }
    $onInit() {
        this.ui = {};
        this.data = {
            customRoot: {
                name: 'My Projects',
                route: 'wb.data_depot.projects.list'
            }
        };
        this.data.projects = [];
        this.loadProjects();
    }
    loadProjects() {
        this.ui.busy = true;
        this.ProjectService.list().then(projects => {
            this.ui.busy = false;
            this.data.projects = projects;
        });
    }
    onBrowse($event, project) {
        $event.preventDefault();
        this.$state.go('wb.data_depot.projects.listing', {
            systemId: project.id,
            filePath: '',
            projectId: project.name
        });
    }
    onBrowseProjectRoot() {
        this.$state.go('wb.data_depot.projects.list')
    }
}

export default ProjectListCtrl
