class DataDepotMainCtrl {
    constructor($stateParams, $state) {
        'ngInject';
        this.$state = $state;
        this.$stateParams = $stateParams;
    }
    $onInit() {
        // this.params is set to the value of $stateParams when the component 
        // resolves.
        if (this.params.systemId === "") {
                var my_data = this.systems.find( sys => sys.name == 'My Data');
                this.$state.go('wb.data_depot.db', {
                    systemId: my_data.systemId,
                    filePath: '',
                    directory: 'agave',
                    name: my_data.name
                });
        }
    }
}

export default DataDepotMainCtrl;
