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
            if (this.params.directory == 'external-resources') {
                this.populateExternalTrail();
            } else if (!this.skipPath) {
                this.populateTrail();
            }
        },
        true
        );
    }

    populateTrail() {
        this.trail = [];
        let splitParams = this.params.filePath.split('/');
        splitParams.slice(this.offset).forEach((name, i) => {
            const path = splitParams.slice(0, this.offset + i + 1).join('/');
            if (i === 0 && this.params.customRoot && !this.skipRoot) {
                name = this.params.customRoot.name;
            }
            this.trail.push({
                path: path,
                system: this.params.systemId,
                name: name,
            });
        });
    }

    populateExternalTrail() {
        let trail = this.params.trail;
        if (trail && trail.length > 0) {
            this.trail = [];
            trail.forEach((tr, i) => {
                let name = tr.name,
                    id = tr.id;
                if (i === 0 && this.params.customRoot && !this.skipRoot) {
                    name = this.params.customRoot.name;
                }
                this.trail.push({
                    name: name,
                    id: id,
                    path: tr.path,
                });
            });
        } else {
            this.populateTrail();
        }
    }
}

export default DataDepotBreadcrumbCtrl;
