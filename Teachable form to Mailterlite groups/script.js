
"use strict";

//TODO: update this to the URL of the Google Apps Script link;
const API_endpoint = 'https://script.google.com/macros/s/AKfycbyhIoBELSHxepVeNq7RhPLPeRiVm0868qsuferb9wxaT4Va3SLV8l_5W0FmV5e9EEqVKA/exec';
const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const groupsRegEx = /^[0-9]+(?:,[0-9]+)*$/;
const sectionElementID = 'mailterlite-course-mailing-list';
const coursePath = window.location.pathname.split('/').pop();
const localStorageName = 'subscribed-in-course__' + coursePath;


function createCourseMailingList(mailterliteCourseGroupIDs) {
    console.group('createCourseMailingList');
    console.log('mailterliteCourseGroupIDs:', mailterliteCourseGroupIDs);

    if (!mailterliteCourseGroupIDs || $.type(mailterliteCourseGroupIDs) !== 'string'
            || !groupsRegEx.test(mailterliteCourseGroupIDs)) {
        console.error('[mailterliteCourseGroupIDs] argument is invalid or missing! expecting one or more numbers separated by commas!');
        console.groupEnd('createCourseMailingList');
        return;
    }

    //if the user subscribed in this course before, don't create a form and end:
    if (localStorage.getItem(localStorageName) === 'true') {
        console.log('user has already subscribed in this course before!');
        console.groupEnd('createCourseMailingList');
        return;
    }


    if (!$(`#${sectionElementID}`).length) {
        console.error('The HTML <section> element is NOT found in the DOM! Insert it into the Teachable custom HTML block first!');
        console.groupEnd('createCourseMailingList');
        return;
    }

    let html = `
                <form data-groups="${mailterliteCourseGroupIDs}" onsubmit="return false">
                    <div class="form-body">
                        <h4>
                            <strong>Interested in this course?</strong>
                        </h4>
                        <p>Join the waiting list!</p>
                        <fieldset>
                            <div>
                                <label for="email">Email Address</label>
                                <input type="email" name="email" class="block__email_leads__input" required="">
                            </div>
                            <div class="block__email_leads__checkbox_wrapper">
                                <input type="checkbox" name="consent" class="block__email_leads__checkbox" required="">
                                <label for="consent">
                                    By clicking this checkbox, you consent to receiving emails from our school.
                                </label>
                            </div>
                        </fieldset>
                        <button class="base-button" type="submit">Subscribe</button>
                        <p class="disclaimer_text">We respect your privacy.</p>
                    </div>
                    <div class="block__email_leads__response"></div>
                </form>
            `;

    $(`#${sectionElementID}`).append(html);

    listenToCourseLeadsForm();

    console.groupEnd('createCourseMailingList');

}



function listenToCourseLeadsForm() {
    console.group('listenToCourseLeadsForm');

    let $form = $(`#${sectionElementID}`).find('form');
    let $submitButton = $($form).find('button[type="submit"]');

    let response = {
        'success': true,
        'message': [],
    };

    $($form).on('submit', function (e) {
        console.log('form submit event!');
        console.log('e:', e);

        if ($($form).hasClass('_loading')) {
            return;
        }

        //get the inputs: 
        const groups = $(this).attr('data-groups');
        const email = $(this).find('input[name="email"]').val();
        console.log(`groups: ${groups} | email: ${email}`);

        //validate the inputs:
        if (!email || $.type(email) !== 'string' || !emailRegEx.test(email)) {
            response.success = false;
            response.message.push('[email] is invalid or missing! expecting a valid email string!');
        }

        if (!groups || $.type(groups) !== 'string' || !groupsRegEx.test(groups)) {
            response.success = false;
            response.message.push('[groups] is invalid or missing! expecting one or more numbers separated by commas!');
        }

        console.log('response so far:', response);

        if (!response.success) {
            return printResponse(response);
        }

        $($form).addClass('_loading');
        $($submitButton)
                .text('Loading ...')
                .attr('style', 'background: lightgray; color: #333; cursor: not-allowed;')
                ;

        //send the inputs to the API and handle its response:
        sendUserToAPI(groups, email, function (apiResponse) {
            console.log('API response:', apiResponse);

            printResponse(apiResponse);
        });

    });

    console.groupEnd('listenToCourseLeadsForm');
}



function sendUserToAPI(groups, email, callback) {
    console.group('sendUserToAPI');
    console.log('groups:', groups);
    console.log('email:', email);

    let retryTimes = 3;
    let retryInterval = 1000;

    function sendRequest() {
        const url = `${API_endpoint}?groups=${groups}&email=${email}`;

        fetch(url, {
            redirect: "follow",
            method: "GET",
            //mode: 'no-cors',
            headers: {
                "Content-Type": "text/plain;charset=utf-8",
            }
        })
                .then(function (getResponse) {
                    if (!getResponse.ok) {
                        throw new Error(`Server response is NOT ok! status: ${getResponse.status}`);
                    }
                    return getResponse.text();
                })
                .then(handleSuccessResponse)
                .catch(handleServerError);


        function handleServerError(error) {
            console.error('API error occurred:\n', error);

            retryTimes--;
            if (!retryTimes) {
                console.groupEnd('sendUserToAPI');
                //call the callback function, if any;
                if (callback && typeof callback === 'function') {
                    callback(null);
                }
                return;
            }

            setTimeout(function () {
                sendRequest();
            }, retryInterval);
        }


        function handleSuccessResponse(response) {
            console.log('API response success!\nresponse:', response);
            if (typeof response === 'string') {
                response = JSON.parse(response);
            }

            console.groupEnd('sendUserToAPI');
            //call the callback function, if any;
            if (callback && typeof callback === 'function') {
                callback(response);
            }
        }

    }

    sendRequest();

}



function printResponse(response) {
    console.group('printResponse');
    console.log('response:', response);

    let $form = $(`#${sectionElementID}`).find('form');
    let $formBody = $($form).find('.form-body');
    let $formResponse = $($form).find('.block__email_leads__response');
    let $submitButton = $($form).find('button[type="submit"]');

    let responseType;
    let message;
    let style = {
        'success': {
            'box-shadow': '0 0 0 1px #a3c293 inset, 0 0 0 0 transparent;',
            'background-color': '#fcfff5',
            'color': '#2c662d',
        },
        'fail': {
            'box-shadow': '0 0 0 1px #e0b4b4 inset, 0 0 0 0 transparent',
            'background-color': '#fff6f6',
            'color': '#9f3a38',
        }
    };

    $($form).removeClass('_loading');
    $($submitButton)
            .text('Subscribe')
            .attr('style', '')
            ;

    if (!response || !Object.keys(response).length) {
        console.error('[response] argument is invalid or missing! expecting a non-empty object!');
        responseType = 'fail';
        message = 'Internal server error!';

    } else {
        responseType = (response.success) ? 'success' : 'fail';
        message = (function () {
            if (!response.userMessage || !response.userMessage.length) {
                return 'Internal server error!';
            }
            if (response.userMessage.length === 1) {
                return response.userMessage.join();
            }
            return '<ul><li>' + response.userMessage.join('</li><li>') + '</li></ul>';
        }());
    }

    let styleString = (function () {
        let string = '';
        for (let key in style[responseType]) {
            string += `${key}: ${style[responseType][key]}; `;
        }
        return string;
    }());

    console.log('styleString:', styleString);

    let html = `
                <div class="${responseType}" 
                    style="font-size: 2em; margin: 1em; padding: 1em; border-radius: 0.5em; ${styleString}"> 
                    ${message}
                </div>
            `;

    $($formResponse).html(html);

    if (responseType === 'success') {
        $($formBody).hide();

        //save a value to the browser's localStorage, to avoid showing the form again: 
        localStorage.setItem(localStorageName, 'true');

    }

    console.groupEnd('printResponse');

}




