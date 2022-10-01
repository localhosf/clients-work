

(function () {

    //let $form = $submitBtn.parentNode.closest('form');
    const API_KEY = 'A35E990061B34F189351B65456AD275C'; //TODO: move this to a back-end.
    let waitForTypingToFinish;
    let inputValueBefore;
    let $input = document.querySelector('input[data-label*="Phone"]');
    let $inputParent = $input.parentNode.closest('div');
    let $inputContainer = $input.parentNode.closest('.input');
    let $submitBtn = document.querySelector('button.submit');
    let $continueBtn = document.querySelector('button.continue');
    let $newLoadingSpinner = document.createElement('div');
    $newLoadingSpinner.classList.add('_loading-spinner');
    $newLoadingSpinner.innerHTML = `
        <svg class="_spinner" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><g fill="none"><path id="track" fill="#C6CCD2" d="M24,48 C10.745166,48 0,37.254834 0,24 C0,10.745166 10.745166,0 24,0 C37.254834,0 48,10.745166 48,24 C48,37.254834 37.254834,48 24,48 Z M24,44 C35.045695,44 44,35.045695 44,24 C44,12.954305 35.045695,4 24,4 C12.954305,4 4,12.954305 4,24 C4,35.045695 12.954305,44 24,44 Z"/><path id="section" fill="#3F4850" d="M24,0 C37.254834,0 48,10.745166 48,24 L44,24 C44,12.954305 35.045695,4 24,4 L24,0 Z"/></g></svg>
    `;

    // listen to the input, to automatically format the number, as the user types it: 
    $input.oninput = function () {
        let inputValue = this.value;

        //remove the error message: 
        $inputContainer.classList.remove('__error');

        //enable the submit buttons: 
        $submitBtn.disabled = false;
        $continueBtn.disabled = false;
        $submitBtn.classList.remove('__disabled');
        $continueBtn.classList.remove('__disabled');

        //Hide the loading spinner, if it's showing from before: 
        let $loadingSpinner = document.querySelector('._loading-spinner');
        if ($loadingSpinner) {
            $loadingSpinner.style.display = 'none';
        }

        //clear the waiting timer, if found before: 
        if (waitForTypingToFinish) {
            clearTimeout(waitForTypingToFinish);
        }

        //if no value at all, return: 
        if (!inputValue || !inputValue.length) {
            return;
        }

        //if the value is the same as before, return: 
        if (inputValue === inputValueBefore) {
            return;
        }

        //if the value matches a valid RegEx:
        if ((/^(\(\d{3}\) \d{3}-\d{4})$/i).test(inputValue)) {
            console.log('Input value matches a valid RegEx!');

            //disable the submit buttons: 
            $submitBtn.disabled = true;
            $continueBtn.disabled = true;
            $submitBtn.classList.add('__disabled');
            $continueBtn.classList.add('__disabled');

            //show the loading spinner: 
            if ($loadingSpinner) {
                $loadingSpinner.style.display = 'flex';
            } else {
                $inputParent.after($newLoadingSpinner);
                $inputParent.style.display = 'inline-block';
            }

            //wait for 2 seconds before calling the API, 
            //in case the user wanting to edit the number: 
            waitForTypingToFinish = setTimeout(function () {
                validateNumber(inputValue);
            }, 2000);

            return;
        }

        //if the input value still not matching with the RegEx:         
        //format the value:
        let newValue = getFormattedNumber(inputValue);
        //replace the input value with the newly formatted value: 
        $input.value = (newValue) ? newValue : '';
        //save the new value in the valueBefore variable, for future validations: 
        inputValueBefore = newValue;

    };



    function getFormattedNumber(oldValue) {
        //console.group('getFormattedNumber');

        //if no value at all, return: 
        if (!oldValue || !oldValue.length) {
            //console.error('[oldValue] parameter is empty!');
            return null;
        }
        //if the value matches a valid RegEx, return it:
        if ((/^(\(\d{3}\) \d{3}-\d{4})$/i).test(oldValue)) {
            //console.log('[oldValue] matches a valid RegEx. Returning it!');
            return oldValue;
        }

//    console.log(`
//        oldValue: ${oldValue}
//        oldValue.length: ${oldValue.length}
//    `);

        //trim the number from anything non-numeric: 
        oldValue = oldValue.replaceAll(/[^\d]/gi, '');

//    console.log(`
//        After removing anything non-numeric: 
//        oldValue: ${oldValue}
//        oldValue.length: ${oldValue.length}
//    `);

        //otherwise, start processing the value:
        let oldValueAsArray = oldValue.split('');
        let newValue = '';

        //console.log('looping the value letters ...');
        oldValueAsArray.forEach(function (letter, letterIndex) {
            //console.warn(`letterIndex: ${letterIndex} | letter: ${letter}`);

            switch (true) {
                // Goal: (999) 999-9999
                case(letterIndex === 0):
                    newValue += '(' + letter;
                    break;

                    // Goal: (999) 999-9999
                case(letterIndex === 2):
                    newValue += letter + ') ';
                    break;

                    // Goal: (999) 999-9999
                case(letterIndex === 5):
                    newValue += letter + '-';
                    break;

                    // Goal: (999) 999-9999
                case([1, 3, 4, 6, 7, 8, 9].includes(letterIndex)):
                    newValue += letter;
                    break;

                    // Goal: (999) 999-9999
                default:
                    //if the letterIndex is > 13, remove it: 
                    if (letterIndex > 9) {
                        //console.log('letterIndex > 9. Not adding it!');
                    }
                    break;
            }

//        console.log(`
//            newValue: ${newValue}
//            newValue.length: ${newValue.length}
//        `);

            //if the newValue is over the maximum length 
            // && does NOT match a valid RegEx, re-format it again:
            if (newValue.length > 13 && !(/^(\(\d{3}\) \d{3}-\d{4})$/i).test(newValue)) {
                //console.error('the newValue does NOT match a valid RegEx, re-formatting it again...');
                newValue = getFormattedNumber(newValue);
            }
        });

        //console.groupEnd('getFormattedNumber');
        return newValue;

    }



    function validateNumber(number) {
        //console.group('validateNumber');
        //console.log('number:', number);

        //validate the number: 
        if (!number) {
            console.error('[number] argument is empty!');
            return;
        }
        if (!(/^(\(\d{3}\) \d{3}-\d{4})$/i).test(number)) {
            console.error('[number] argument is invalid format!');
            return;
        }

        //trim the number from anything non-numeric: 
        number = number.replaceAll(/[^\d]/gi, '');

        //API documentation: https://veriphone.io/docs/v2 

        let requestURL = `https://api.veriphone.io/v2/verify?default_country=US&key=${API_KEY}&phone=${number}`;
        //console.log('request URL:', requestURL);

        //curl -i -H "Accept: application/json" 'https://api.veriphone.io/v2/verify?default_country=US&key=A35E990061B34F189351B65456AD275C&phone=9999999999' 

        //API response example: 
        /*
         {
         "status": "success",
         "phone": "9999999999",
         "phone_valid": false,
         "phone_type": "unknown",
         "phone_region": "",
         "country": "",
         "country_code": "",
         "country_prefix": "0",
         "international_number": "+1 999-999-9999",
         "local_number": "(999) 999-9999",
         "e164": "+19999999999",
         "carrier": ""
         }
         */

        //call the API and wait for its response: 
        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
            if (this.readyState === 4) {
                //console.log('API request complete');
                let response = this.responseText;
                response = JSON.parse(response);

                //remove the loading spinner:
                let $loadingSpinner = document.querySelector('._loading-spinner');
                if ($loadingSpinner) {
                    $loadingSpinner.style.display = 'none';
                }

                if (this.status === 200) {
                    //console.log('API success response:\n', response);

                    //if response is invalid number: 
                    if (!response.phone_valid) {
                        console.warn('Invalid phone number!');
                        //show error message:
                        $inputContainer.classList.add('__error');

                        //if response is valid number: 
                    } else {
                        console.log('Valid phone number!');
                        //remove the error message: 
                        $inputContainer.classList.remove('__error');

                        //enable the submit buttons: 
                        $submitBtn.disabled = false;
                        $continueBtn.disabled = false;
                        $submitBtn.classList.remove('__disabled');
                        $continueBtn.classList.remove('__disabled');
                    }

                } else {

                    console.error('API fail response:\n', response);
                    switch (this.status) {
                        case(400):
                            console.error(
                                    'Bad request!'
                                    + '\ninput parameter is missing or not valid!'
                                    );
                            break;
                        case(401):
                            console.error(
                                    'Unauthorized!'
                                    + '\nAPI key is missing or not valid!'
                                    );
                            break;
                        case(402):
                            console.error(
                                    'Payment required!'
                                    + '\nno credits are available to cover the cost of the API requested operation!'
                                    );
                            break;
                        case(403):
                            console.error('Forbiden!');
                            console.error(
                                    'Forbiden!'
                                    + '\naccess is not granted to the requested resource!'
                                    );
                            break;
                        case(500):
                            console.error(
                                    'Server error!'
                                    + '\nfailure on veriphone servers. Please report it to support@veriphone.io'
                                    );
                            break;
                        default:
                            console.error('Unknown API response!');
                            break;
                    }

                    //remove the error message: 
                    $inputContainer.classList.remove('__error');

                    //enable the submit buttons: 
                    $submitBtn.disabled = false;
                    $continueBtn.disabled = false;
                    $submitBtn.classList.remove('__disabled');
                    $continueBtn.classList.remove('__disabled');

                }
            }
        };

        xhttp.open("GET", requestURL, true);
        xhttp.send();

        //console.groupEnd('validateNumber');

    }


})();


