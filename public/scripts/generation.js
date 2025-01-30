const optionalFields = document.querySelectorAll('label.optional');
const certSelection = document.querySelector('select[name="pdfTemplate"]');
const configForm = document.getElementById('configuration-form');

// Form Validation and Submission
document.getElementById('config-submit').addEventListener('click', () => {
    // disable the submit button
    disableSubmitButton();

    // gather the fields that should be validated
    let visibleFields = [];

    // add the basic 3 fields as they're always needed
    visibleFields.push(document.querySelector('input[name="filePrefix"]'));
    visibleFields.push(document.querySelector('input[name="csvUpload"]'));
    visibleFields.push(document.querySelector('select[name="pdfTemplate"]'));

    // add all the visible optional fields
    optionalFields.forEach((field) => {
        if (!field.classList.contains('hidden')) {
            // the first element should be an input
            // push it onto the array of visible elements
            visibleFields.push(field.firstElementChild);
        }
    });

    // verify the fields have content
    let readyToSubmit = true;
    visibleFields.forEach((field) => {
        if (field.value === "" || field.value === null) {
            readyToSubmit = false;
        }
    })

    // submit form
    if (readyToSubmit) {
        console.log("Submitting form");
        disableSubmitButton();
        

        configForm.submit();
    } else {
        enableSubmitButton();
        console.log("Will NOT Submit");
    }
});

// Form Reset
document.getElementById('config-reset').addEventListener('click', () => {
    // reset the textareas and inputs to default values
    let inputs = document.querySelectorAll('input');
    let textAreas = document.querySelectorAll('textarea');

    inputs.forEach((el) => {
        el.value = "";
    });
    textAreas.forEach((el) => {
        el.value = "";
    });

    // reset the cert selection to the default
    certSelection.selectedIndex = 0;

    // hide all optional fields
    optionalFields.forEach((el) => {
       el.classList.add('hidden');
    });
});

// Change form based on certificate selection
certSelection.addEventListener('change', async () => {
    // console.log('cert selection changed');
    const selectedCertificate = certSelection.value;

    // get the instructions for the selected template
    const url = `/storage/data/${selectedCertificate}.json`;
    console.log(`Fetching ${url}`);

    // console.log('Fetching data...', url);
    fetch(url)
        .then(res => res.json())
        .then(data => updateFormFields(data))
        .catch(error => console.error(`Error fetching instructions: ${error}`));
});

function updateFormFields(data) {
    // console.log("Updating form fields.");
    // hide all fields
    optionalFields.forEach((opt) => {
        opt.classList.add('hidden');
    })

    // get the required fields from the data
    let fields = null;
    for (let key in data) {
        if (key === "fields") {
            fields = data[key];
        }
    }

    if (fields) {
        for (let field in fields) {
            showOptionalField(field);
        }
    } else {
        alert("Could not load required fields.");
    }
}

function showOptionalField(field) {
    // console.log("Showing ", field);
    // match the required field to the "for" tag and un-hide it
    document.querySelector(`label[for="${field}"]`).classList.remove('hidden');
}

function disableSubmitButton() {
    // disable the button
    const submitButton = document.getElementById('config-submit');
    submitButton.disabled = true;

    // create the spinner and assign the animation to it
    const spinner = document.createElement('div');
    spinner.id = "loading";

    // remove the inner text and append the spinner
    submitButton.innerText = "";
    submitButton.appendChild(spinner);
}

function enableSubmitButton() {
    const submitButton = document.getElementById('config-submit');
   
    // remove the spinner from the submitButton
    try {
        const spinner = document.getElementById('loading');
        submitButton.removeChild(spinner);
    } catch (err) {
        console.log(err);
    }

    // reset the inner text of the submit button
    submitButton.innerText = "Generate";
    // re-enable the submit button
    submitButton.disabled = false;
}
