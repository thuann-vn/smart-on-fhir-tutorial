
// Our app is written in ES3 so that it works in older browsers!

function createRenderer(id) {
    const output = id ? document.getElementById(id) : document.body;
    return function (data) {
        output.innerText = data && typeof data === "object"
            ? JSON.stringify(data, null, 4)
            : String(data);
    };
}

function App(client) {
    this.client = client;
}

App.prototype.fetchCurrentPatient = function () {
    var render = createRenderer("patient");
    render("Loading...");
    return this.client.patient.read().then(render, render);
};

App.prototype.fetchCurrentEncounter = function () {
    var render = createRenderer("encounter");
    render("Loading...");
    return this.client.encounter.read().then(render, render);
};

App.prototype.fetchCurrentUser = function () {
    var render = createRenderer("user");
    render("Loading...");
    return this.client.user.read().then(render, render);
};

App.prototype.fetchAppointments = function () {
    var client = this.client;
    var fetchAppointments = function () {
        return client.request('Appointment?patient=' + client.getPatientId()).then(function (response) {
            var $appointmentTable = $('#appointment-table');
            $appointmentTable.find('tbody').html('');
            response.entry.forEach(function (item) {
                $appointmentTable.find('tbody').append('<tr><td>' + item.resource.id + '</td><td>' + JSON.stringify(item.resource) + '</td><td><button class="view-detail" data-id="' + item.resource.id + '">View Detail</button></td><td><button class="generate-meeting" data-id="' + item.resource.id + '">Generate meeting</button></td></tr>')
            })
        });
    }
    fetchAppointments();

    //Bind generate meeting button
    $('body').on('click', '.generate-meeting', function (e) {
        e.preventDefault();
        client.request({
            url: "Appointment/" + $(this).data('id'),
            method: "PATCH",
            // headers: {
            //     'Accept': 'application/fhir+json',
            //     'Content-Type': 'application/json-patch+json',
            //     'If-Match': 'W/"1"'
            // },
            body: {
                "op": "replace",
                "path": "/status",
                "value": "cancelled"
            }
        })
            .then(function (response) {
                alert('Update success')
            })
            .fail(function (err) {
                alert('Update failed')
            })
    })


    //Bind apt button 
    $('#book-appt').click(function () {
        var appointmentParams = {
            "resourceType": "Appointment",
            "status": "proposed",
            "contained": [
                {
                    "resourceType": "HealthcareService",
                    "id": "28",
                    "type": [
                        {
                            "text": "Patient Virtual Meeting Room"
                        }
                    ],
                    "telecom": [
                        {
                            "system": "url",
                            "value": "https://thua-nguyen.vsee.me/",
                            "period": {
                                "start": "2020-07-13T08:00:00.000Z",
                                "end": "2020-07-13T08:10:00.000Z"
                            }
                        }
                    ]
                },
                {
                    "resourceType": "HealthcareService",
                    "id": "31",
                    "type": [
                        {
                            "text": "Provider Virtual Meeting Room"
                        }
                    ],
                    "telecom": [
                        {
                            "system": "url",
                            "value": "https://thua-nguyen.vsee.me/",
                            "period": {
                                "start": "2020-07-13T08:00:00.000Z",
                                "end": "2020-07-13T08:10:00.000Z"
                            }
                        }
                    ]
                }
            ],
            "serviceType": [
                {
                    "coding": [
                        {
                            "system": "https://fhir.cerner.com/ec2458f2-1e24-41c8-b71b-0e701af7583d/codeSet/14249",
                            "code": "2572307911",
                            "display": "Video Visit",
                            "userSelected": true
                        }
                    ],
                    "text": "Video Visit"
                }
            ],
            "reasonCode": [
                {
                    "text": "Test Video Visit"
                }
            ],
            "comment": "Appointment request comment",
            "participant": [
                {
                    "actor": {
                        "reference": "Patient/" + client.getPatientId()
                    },
                    "status": "needs-action"
                }
            ],
            "requestedPeriod": [
                {
                    "start": "2020-02-07T13:28:17-05:00",
                    "end": "2021-02-07T13:28:17-05:00"
                }
            ]
        }
        console.log(appointmentParams)
        client.request({
            'url': "Appointment",
            'method': 'POST',
            'body': JSON.stringify(appointmentParams),
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then(function (response) {
                console.log(response)
                alert('Created new apt: ' + response.id)
                fetchAppointments();
            })
            .fail(function (err) {
                console.log(err);
            })
    })
};

App.prototype.request = function (requestOptions, fhirOptions) {
    var render = createRenderer("output");
    render("Loading...");
    return this.client.request(requestOptions, fhirOptions).then(render, render);
};

App.prototype.renderContext = function () {
    return Promise.all([
        this.fetchCurrentPatient(),
        this.fetchCurrentUser(),
        this.fetchCurrentEncounter(),
        this.fetchAppointments()
    ]);
};

App.prototype.setLabel = function (containerId, label) {
    document.getElementById(containerId).previousElementSibling.innerText = label;
};

