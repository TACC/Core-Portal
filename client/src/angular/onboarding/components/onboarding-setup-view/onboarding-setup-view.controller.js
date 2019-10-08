class OnboardingSetupViewCtrl {
    constructor(UserService, OnboardingSetupService, Notifications, 
                $scope, $window, $uibModal) {
        'ngInject';
        this.UserService = UserService;
        this.OnboardingSetupService = OnboardingSetupService;
        this.viewingSelf = false;
        this.isStaff = false;
        this.user = { };
        this.events = Notifications.subject;
        this.$scope = $scope;
        this.$window = $window;
        this.showAdmin = false;
        this.$uibModal = $uibModal;
    }

    $onInit() {
        // This view may be loaded outside of the workbench/dashboard,
        // where authenticate() is called during routing,
        // so the user should be authenticated.
        this.UserService.authenticate().then(
            (result) => {
                if (!this.username || 
                    this.username.length == 0 || 
                    result.username == this.username) {
                    // If there is no username binding, the user is 
                    // viewing themselves.
                    this.viewingSelf = true;
                    this.username = result.username;
                }

                // Check if the authenticated user is a
                // staff member
                this.isStaff = result.isStaff;

                // Get step data for this user
                // TODO: If a step has a data object, it may be used
                // to display user options in the client UI, such
                // as selecting an allocation from a list
                this.OnboardingSetupService.list(this.username).then(
                    (response) => {
                        this.user = response;
                        this.subscribe();
                    },
                )
            },
        )
    }

    subscribe() {
        // Subscribe to all Notification events, but process
        // only setup_events
        this.events.subscribe(
            (message) => {
                if (message.event_type === "setup_event") {
                    this.processEvent(message.setup_event)
                }
            }
        )
    }

    hasStepEvents() {
        return this.user.steps.some(
            (step) => {
                return step.events.length > 0;
            }
        )
    }

    showAllSteps() {
        return this.showAdmin || this.hasStepEvents();
    }

    showStepEvents(step) {
        return this.showAdmin || step.events.length > 0;
    }

    showAdminInterface() {
        return this.isStaff & this.showAdmin;
    }

    processEvent(event) {
        // Process any incoming setup step events
        if (event.username !== this.username) {
            // Only process events that match the user currently being viewed
            return;
        }

        if (event.step === "portal.apps.onboarding.execute.execute_setup_steps") {
            // Process an event for a user's setup_complete state changing
            this.user.setupComplete = event.data.setup_complete;
            if (this.viewingSelf && this.user.setupComplete) {
                // If a user is viewing themselves and their setup becomes
                // complete, forward them to the dashboard
                this.$window.location.href = "/workbench/dashboard";
            }
        }
        
        // Find the matching step for the incoming event
        let found_step = this.user.steps.find(
            (step) => { 
                return step.step === event.step
            }
        )

        // Update this step
        if (found_step) {
            found_step.events.unshift(event);
            found_step.state = event.state;
            found_step.data = event.data;
        }


        // Trigger Angular refresh
        this.$scope.$digest();
    }

    clearError(step) {
        // Clears out error messages
        step.userError = false;
        step.staffError = false;
    }

    setError(step, actionName, error) {
        // Sets error states if a user's client action fails
        if (actionName === "user_confirm") {
            step.userError = true;
        } else {
            step.staffError = true;
        }
        step.errorSubject = "Account Setup Error while attempting " 
                                + actionName + " on " + step.displayName;
        step.errorInfo = actionName + " on " + step.step + ": " + JSON.stringify(error);
    }

    toggleStepLog(step) {
        if (!step.expanded) {
            step.expanded = true;
        } else {
            step.expanded = false;
        }
    }

    action(step, actionName, data) {
        // Call an action
        // TODO: For client interactions that require additional data
        // to be sent, such as selecting an option from a dropdown,
        // send it as the data parameter.
        this.clearError(step);
        step.saving = true;
        this.OnboardingSetupService.action(this.user.username, step.step, actionName, data).then(
            (response) => {
                // Copy the new state into the step
                step.state = response.state;
                step.data = response.data;
                step.events.unshift(response);
            },
            (error) => {
                this.setError(step, actionName, error);
            }
        ).finally(
            () => {
                step.saving = false;
            }
        );
    }

    openMoreInfo(step, event) {
        this.$uibModal.open({
            component: 'OnboardingInfoModal',
            resolve: {
                event: () => {
                    return event;
                },
                step: () => {
                    return step;
                }
            },
        });
    }
};

export default OnboardingSetupViewCtrl; 
