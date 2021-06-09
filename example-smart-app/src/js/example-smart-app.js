(function (window) {
  window.extractData = function () {
    var ret = $.Deferred();

    function onError() {
      console.log('Loading error', arguments);
      ret.reject();
    }

    function fetchAppointments(smart) {
      smart.api.search({ type: "Appointment" })
        .then(function (response) {
          var $appointmentTable = $('#appointment-table');
          $appointmentTable.find('tbody').html('');
          response.data.entry.forEach(function (item) {
            $appointmentTable.find('tbody').append('<tr><td>' + item.resource.id + '</td><td>' + JSON.stringify(item.resource) + '</td><td><button class="view-detail" data-id="' + item.resource.id + '">View Detail</button></td></tr>')
          })
        })
        .fail(function (err) { console.log(err); alert('Loading appointments failed!') })
    }

    function onReady(smart) {
      window.smart = smart;
      console.log(smart)

      if (smart.hasOwnProperty('patient')) {
        var patient = smart.patient;
        var pt = patient.read();
        var obv = smart.patient.api.fetchAll({
          type: 'Observation',
          query: {
            code: {
              $or: ['http://loinc.org|8302-2', 'http://loinc.org|8462-4',
                'http://loinc.org|8480-6', 'http://loinc.org|2085-9',
                'http://loinc.org|2089-1', 'http://loinc.org|55284-4']
            }
          }
        });

        $.when(pt, obv).fail(onError);

        $.when(pt, obv).done(function (patient, obv) {
          var byCodes = smart.byCodes(obv, 'code');
          var gender = patient.gender;

          var fname = '';
          var lname = '';

          if (typeof patient.name[0] !== 'undefined') {
            if (typeof patient.name[0].given == 'string') {
              fname = patient.name[0].given;
            } else {
              fname = patient.name[0].given.join(' ');
            }

            if (typeof patient.name[0].family == 'string') {
              lname = patient.name[0].family;
            } else {
              lname = patient.name[0].family.join(' ');
            }
          }

          var height = byCodes('8302-2');
          var systolicbp = getBloodPressureValue(byCodes('55284-4'), '8480-6');
          var diastolicbp = getBloodPressureValue(byCodes('55284-4'), '8462-4');
          var hdl = byCodes('2085-9');
          var ldl = byCodes('2089-1');

          var p = defaultPatient();
          p.birthdate = patient.birthDate;
          p.gender = gender;
          p.fname = fname;
          p.lname = lname;
          p.height = getQuantityValueAndUnit(height[0]);

          if (typeof systolicbp != 'undefined') {
            p.systolicbp = systolicbp;
          }

          if (typeof diastolicbp != 'undefined') {
            p.diastolicbp = diastolicbp;
          }

          p.hdl = getQuantityValueAndUnit(hdl[0]);
          p.ldl = getQuantityValueAndUnit(ldl[0]);

          ret.resolve(p);
        });

        //Load appointment list
        fetchAppointments(smart)

        //Bind apt button 
        $('#book-appt').click(function () {
          var appointmentParams = {
            "type": "Appointment",
            "data": {
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
                      "code": "408443003",
                      "system": "http://snomed.info/sct"
                    }
                  ]
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
                    "reference": "Patient/" + patient.id
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

          }
          smart.api.create(appointmentParams)
            .done(function (response) {
              console.log(response)
              alert('Created new apt: ' + response.data.id)
              fetchAppointments(smart);
            })
            .fail(function (err) {
              console.log(err);
            })
        })

        //Bind generate meeting button
        $('body').on('click', '.view-detail', function (e) {
          e.preventDefault();
          var getParams = {
            "id": $(this).data('id'),
            "type": "Appointment"
          }
          smart.api.read(getParams)
          .then(function (response) { 
            alert('Get apt details success')
            $('#appointment-detail').html(JSON.stringify(response.data, null, "\t"))
           })
          .fail(function(err){
            console.error(err);
            alert('Get apt details failed')
          })
        })


        //Bind generate meeting button
        $('body').on('click', '.generate-meeting', function (e) {
          e.preventDefault();
          var updateParams = {
            "id": $(this).data('id'),
            "data": {
              "resourceType": "Appointment",
              "id": $(this).data('id'),
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
                      "value": "https://www.vsee.com/",
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
                      "value": "https://www.vsee.com/",
                      "period": {
                        "start": "2020-07-13T08:00:00.000Z",
                        "end": "2020-07-13T08:10:00.000Z"
                      }
                    }
                  ]
                }
              ]
            },
            "type": "Appointment"
          }
          smart.api.update(updateParams)
          .then(function (response) { 
            alert('Update success')
            fetchAppointments(smart)
           })
          .fail(function(err){
            alert('Update failed')
          })
        })

        //Get appointments
      } else {
        onError();
      }
    }

    FHIR.oauth2.ready(onReady, onError);
    return ret.promise();
  };

  function defaultPatient() {
    return {
      fname: { value: '' },
      lname: { value: '' },
      gender: { value: '' },
      birthdate: { value: '' },
      height: { value: '' },
      systolicbp: { value: '' },
      diastolicbp: { value: '' },
      ldl: { value: '' },
      hdl: { value: '' },
    };
  }

  function getBloodPressureValue(BPObservations, typeOfPressure) {
    var formattedBPObservations = [];
    BPObservations.forEach(function (observation) {
      var BP = observation.component.find(function (component) {
        return component.code.coding.find(function (coding) {
          return coding.code == typeOfPressure;
        });
      });
      if (BP) {
        observation.valueQuantity = BP.valueQuantity;
        formattedBPObservations.push(observation);
      }
    });

    return getQuantityValueAndUnit(formattedBPObservations[0]);
  }

  function getQuantityValueAndUnit(ob) {
    if (typeof ob != 'undefined' &&
      typeof ob.valueQuantity != 'undefined' &&
      typeof ob.valueQuantity.value != 'undefined' &&
      typeof ob.valueQuantity.unit != 'undefined') {
      return ob.valueQuantity.value + ' ' + ob.valueQuantity.unit;
    } else {
      return undefined;
    }
  }

  window.drawVisualization = function (p) {
    $('#holder').show();
    $('#loading').hide();
    $('#fname').html(p.fname);
    $('#lname').html(p.lname);
    $('#gender').html(p.gender);
    $('#birthdate').html(p.birthdate);
    $('#height').html(p.height);
    $('#systolicbp').html(p.systolicbp);
    $('#diastolicbp').html(p.diastolicbp);
    $('#ldl').html(p.ldl);
    $('#hdl').html(p.hdl);
  };

})(window);
