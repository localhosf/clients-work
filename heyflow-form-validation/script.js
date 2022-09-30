

(function () {

    let $input = document.querySelector('input[data-label*="Phone"]');
    //$input.style.border = '5px solid green';

    // automatically format the number, as the user types it:
    let valueBefore;
    $input.oninput = function () {
        //if no value at all, return: 
        if (!this.value || !this.value.length) {
            return;
        }
        //if the value is the same as before, return: 
        if (this.value === valueBefore) {
            return;
        }
        //if the value matches a valid RegEx, return:
        if ((/^(\(\d{3}\) \d{3}-\d{4})$/i).test(this.value)) {
            return;
        }

        //format the value:
        let newValue = getFormattedNumber(this.value);

        //replace the input value with the newly formatted value: 
        $input.value = (newValue) ? newValue : '';

        //save the new value in the valueBefore variable, for future validations: 
        valueBefore = newValue;
    };


    //listen to the field submit: 



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


})();

