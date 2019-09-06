const notificationsFixture = [
    {
        label: "Interactive",
        event_type: "VNC",
    },
    {
        label: "Interactive",
        event_type: "WEB"
    },
    {
        label: "Success",
        status: "SUCCESS"
    },
    {
        label: "Running",
        extra: {
            status: "RUNNING"
        }
    },
    {
        label: "Processing",
        extra: {
            status: "QUEUED"
        }
    },
    {
        label: "Processing",
        extra: {
            status: "SUBMITTING"
        }
    },
    {
        label: "Processing",
        extra: {
            status: "STAGED"
        }
    },
    {
        label: "Processing",
        extra: {
            status: "PROCESSING_INPUTS"
        }
    },
    {
        label: "Pending",
        extra: {
            status: "PENDING"
        }
    }
];

export { notificationsFixture };