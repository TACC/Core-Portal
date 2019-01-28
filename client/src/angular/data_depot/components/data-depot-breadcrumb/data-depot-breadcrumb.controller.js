class DataDepotBreadcrumbCtrl {
    constructor($scope) {
        'ngInject';
        this.$scope = $scope;
    }
    $onInit() {
        this.offset = 0;
        this.trail = [];
        if (this.skipRoot) {
            this.offset = 1;
        }
        this.$scope.$watch(() => this.params, () => {
            if (!this.skipPath) {
                this.populate_trail();
            }
        },
        true
        );
    }
    populate_trail() {
        this.trail = [];
        let split_params = this.params.filePath.split('/');
        split_params.slice(this.offset).forEach((name, i) => {
            const path = split_params.slice(0, this.offset + i + 1).join('/');
            if (i === 0 && this.params.customRoot && !this.skipRoot) {
                name = this.params.customRoot.name;
            }
            this.trail.push({
                path: path,
                system: this.params.systemId,
                name: name
            });
        });
    }
}

export default DataDepotBreadcrumbCtrl;
