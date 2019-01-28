import template from './app-tray.template.html';
import './app-tray.css';
import $ from 'jquery';

class ApplicationTrayCtrl {

    constructor($rootScope, $stateParams, $translate,
        Apps, SimpleList, MultipleList, Notifications, $mdToast) {
        'ngInject';
        this.$rootScope = $rootScope;
        this.$stateParams = $stateParams;
        this.$translate = $translate;
        this.Apps = Apps;
        this.SimpleList = SimpleList;
        this.MultipleList = MultipleList;
        this.Notifications = Notifications;
        this.$mdToast = $mdToast;

    }

    $onInit() {
        this.tabs = [];
        this.outsideClick = false;
        this.simpleList = new this.SimpleList();
        this.simpleList.getPrivate();
        this.data = {
            activeApp: null,
            publicOnly: false,
            type: null
        };
        this.$rootScope.$on('close-app', (e, label) => {
            if (this.data.activeApp && this.data.activeApp.label === label) {
                this.data.activeApp = null;
            }
        });
        this.refreshApps();

        // TODO: This should be doable without jQuery.
        $(document).mousedown((event) => {
            var element = $(event.target);
            var workspaceTab = element.closest(".workspace-tab");
            var appsTray = element.closest("div .apps-tray");

            // Want all tabs to be inactive whenever user clicks outside the tab-tray.
            if (!(appsTray.length > 0 || workspaceTab.length > 0) && this.activeTab != null) {
                this.outsideClick = true;
            } else {
                this.outsideClick = false;

                // If user clicks on same tab, close tab.
                if (workspaceTab.length == 1 && this.activeTab != null && workspaceTab[0].innerText.includes(this.tabs[this.activeTab].title)) {
                    if (workspaceTab.hasClass("active")) {
                        this.activeTab = null;
                    }
                }
            }
        });
    }


    addDefaultTabs() {
        this.error = '';
        return this.simpleList.getDefaultLists();
    }



    closeApp(label) {
        this.$rootScope.$broadcast('close-app', label);
        this.data.activeApp = null;
    }



    refreshApps() {
        this.error = '';
        this.requesting = true;
        this.tabs = [];

        if (this.$stateParams.appId) {
            // TODO: Centralize these toasts into the Notifications Service
            this.Apps.getMeta(this.$stateParams.appId)
                .then(
                    function(response) {
                        if (response.data.length > 0) {
                            if (response.data[0].value.definition.available) {
                                this.launchApp(response.data[0]);
                            } else {
                                this.$mdToast.show(this.$mdToast.simple()
                                    .content(this.$translate.instant('error_app_disabled'))
                                    .toastClass('warning')
                                    .parent($("#toast-container")));
                            }
                        } else {
                            this.$mdToast.show(this.$mdToast.simple()
                                .content(this.$translate.instant('error_app_run'))
                                .toastClass('warning')
                                .parent($("#toast-container")));
                        }
                    },
                    function(response) {
                        this.$mdToast.show(this.$mdToast.simple()
                            .content(this.$translate.instant('error_app_run'))
                            .toastClass('warning')
                            .parent($("#toast-container")));
                    }
                );
        }

        this.addDefaultTabs()
            .then(() => {
                this.simpleList.tabs.forEach(function(element) {
                    this.tabs.push({
                        title: element,
                        content: this.simpleList.lists[element],
                        count: this.simpleList.lists[element].length
                    });
                }, this);

                this.activeTab = null;
                this.requesting = false;
            });
    }

    launchApp(app) {
        this.data.activeApp = app;
        this.onAppSelect({ app });
        this.activeTab = null;
    }

    closeTab () {
        if (this.outsideClick) {
            this.activeTab = null;
        }
    }


}
const appTray = {
    template: template,
    bindings: {
        onAppSelect: '&'
    },
    controller: ApplicationTrayCtrl,
};


export default appTray;
