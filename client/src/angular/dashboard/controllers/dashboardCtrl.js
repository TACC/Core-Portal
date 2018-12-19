import DS_TSBarChart from '../charts/DS_TSBarChart';
import moment from 'moment';
import _ from 'underscore';

export default class DashboardCtrl {
    constructor(
        $uibModal,
        Jobs,
        Apps,
        $scope,
        SystemsService,
        UserService,
        systems
    ) {
        'ngInject';
        this.$uibModal = $uibModal;
        this.Jobs = Jobs;
        this.Apps = Apps;
        this.$scope = $scope;
        this.SystemsService = SystemsService;
        this.UserService = UserService;
        this.systems = systems;
        this.mydata_system = _.find(this.systems, (d) => { return d.name === 'My Data'; });
        this.data = {};
        this.ui = {};
        this.display_job_details = false;
        this.loading_tickets = false;
        this.loading_jobs = true;
        this.today = new Date();
        this.usage = { total_storage_bytes: 0 };

        this.first_jobs_date = moment().subtract(14, 'days').startOf('day').toDate();
        let chart_start_date = moment(this.first_jobs_date).subtract(1, 'days').toDate();
        this.chart = new DS_TSBarChart('#ds_jobs_chart')
            .height(250)
            .xSelector(function(d) { return d.key; })
            .ySelector(function(d) { return d.values.length; })
            .start_date(chart_start_date);

        //Systems stuff
        this.data.execSystems = [];
        this.data.strgSystems = [];
        this.ui.loadingSystems = true;
        this.ui.testSystems = {};
        this.ui.pushSystems = {};
        this.ui.resetSystems = {};

        this.chart.on('bar_click', (ev, toggled) => {
            if (toggled) {
                this.display_job_details = true;
            } else {
                this.display_job_details = false;
            }
            this.jobs_details = ev.values;
            this.$scope.$apply();
        });

        //method binding for _this_ to work
        // this.$onInit.bind(this);

    }


    $onInit() {
        this.UserService.usage().then((resp) => {
            this.usage = resp;
        });

        this.Jobs.list(
            {
                limit: 100,
                offset: 0
            }
        ).then((resp) => {
            this.jobs = resp;
            this.jobs = _.filter(this.jobs, (d) => { return moment(d.created).isAfter(this.first_jobs_date); });
            this.chart_data = this.Jobs.jobsByDate(this.jobs);
            this.chart.data(this.chart_data);
            var tmp = _.groupBy(this.jobs, (d) => { return d.appId; });
            this.recent_apps = Object.keys(tmp);
            this.loading_jobs = false;
        });

        this.Apps.list().then((resp) => {
            this.apps = resp.data.response;
        });

        this.SystemsService.list().then((resp) => {
            this.UserService.authenticate().then((response) => {
                const user = response;
                _.each(resp.execution, (exec) => {
                    let pubKey = resp.publicKeys[exec.id];
                    exec.keysTracked = false;
                    if (pubKey.public_key !== null &&
                        typeof pubKey.public_key !== 'undefined') {
                        exec.publicKey = pubKey;
                        exec.keysTracked = true;
                    }
                    this.data.execSystems.push(exec);
                });
                _.each(resp.storage, (strg) => {
                    this.SystemsService.listRoles(strg.id).then((response) => {
                        _.each(response, (role) => {
                            if (role.username === user.username) {
                                if (role.role === 'ADMIN' || role.role === 'PUBLISHER' || role.role === 'OWNER') {
                                    let pubKey = resp.publicKeys[strg.id];
                                    strg.keysTracked = false;
                                    if (pubKey.public_key !== null &&
                                        typeof pubKey.public_key !== 'undefined') {
                                        strg.publicKey = pubKey;
                                        strg.keysTracked = true;
                                    }
                                    this.data.strgSystems.push(strg);
                                }
                            }
                        });
                    });
                });
            });
        }, (err) => {
            this.ui.systemsErrors = err;
        }).finally(() => {
            this.ui.loadingSystems = false;
        });
    }
    // TicketsService.get().then(function (resp) {
    //   this.my_tickets = resp;
    //   this.loading_tickets = false;
    // }, function (err) {
    //   this.loading_tickets = false;
    // });

    /**
    * Test a system
    * @function
    * @param {Object} sys - System object
    */
    testSystem(sys) {
        this.ui.testSystems[sys.id] = {
            testing: true,
            error: false,
            response: null
        };
        this.SystemsService.test(sys).then((resp) => {
            this.ui.testSystems[resp.response.systemId] = {
                testing: false,
                error: false,
                response: resp.response.message
            };
        }, (err) => {
            this.ui.testSystems[err.data.response.systemId] = {
                testing: false,
                error: true,
                response: err.data.response.message
            };
        });
    }

    /**
    * Shows a system's public key
    * @function
    * @param {Object} sys - System Object
    */
    publicKey(sys) {
        alert(sys.publicKey.public_key);
    }

    /**
    * Resets a system's keys
    * @function
    * @param {Object} sys - System object
    */
    resetKeys(sys) {
        this.ui.resetSystems[sys.id] = {
            resetting: true,
            error: false,
            response: null
        };
        this.SystemsService.resetKeys(sys).
            then((resp) => {
                let _sys = _.findWhere(
                    this.data.strgSystems,
                    { id: resp.systemId }
                );
                if (!_sys) {
                    _sys = _.findWhere(
                        this.data.execSystems,
                        { id: resp.systemId }
                    );
                }
                _sys.keysTracked = true;
                _sys.publicKey.public_key = resp.publicKey;
                this.ui.resetSystems[resp.systemId] = {
                    resetting: false,
                    error: false,
                    response: resp.message
                };
            }, (resp) => {
                this.ui.resetSystems[resp.systemId] = {
                    resetting: false,
                    error: true,
                    response: resp.message
                };
            });
    }

    /**
    * Pushes a private key to the specified host
    * @function
    * @param {Object} sys - System object
    */
    pushKey(sys) {
        this.ui.pushSystems[sys.id] = {
            pushing: true,
            error: false,
            response: null
        };
        this.SystemsService.get(sys.id)
            .then((system) => {
                return this.$uibModal.open({
                    component: 'SystemPushKeysModal',
                    resolve: {
                        sys: () => {
                            return system;
                        },
                    },
                }).result;
            }, (err) => {
                this.ui.pushSystems[sys.id] = {
                    resetting: false,
                    error: true,
                    response: err.message
                };
            }).finally(() => {
                this.ui.pushSystems[sys.id] = {
                    resetting: false,
                    error: false,
                    response: ''
                };
            });
    }
}
