
//TODO: update this to the URL of the Google Apps Script link;
const API_endpoint = 'https://script.google.com/macros/s/AKfycbyvzJdT7qMR40bQu_M3UTevPN_BOJU1oUQUrhz1P9CiiCKAM_Lk4xnyGBcYx5ago8FKXg/exec';
const sectionElementID = 'mailterlite-course-mailing-list';
const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const groupIdRegEx = /^[0-9]+(?:,[0-9]+)*$/;


function createCourseMailingList(mailterliteCourseGroupID) {
    console.group('createCourseMailingList');
    console.log('mailterliteCourseGroupID:', mailterliteCourseGroupID);

    if (!mailterliteCourseGroupID || $.type(mailterliteCourseGroupID) !== 'string'
            || !groupIdRegEx.test(mailterliteCourseGroupID)) {
        console.error('[mailterliteCourseGroupID] argument is invalid or missing! expecting one or more numbers separated by comma!');
        console.groupEnd('createCourseMailingList');
        return;
    }
    if (!groupId || $.type(groupId) !== 'string' || !groupIdRegEx.test(groupId)) {
        response.message.push('[groupId] is invalid or missing! expecting one or more numbers separated by comma!');
    }

    if (!$(`#${sectionElementID}`).length) {
        console.error('The HTML <section> element is NOT found in the DOM! Insert it into the Teachable custom HTML block first!');
        console.groupEnd('createCourseMailingList');
        return;
    }

    let html = `
    <form id="${mailterliteCourseGroupID}" onsubmit="return false">
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

    let response = {
        'success': false,
        'message': [],
    };

    $($form).on('submit', function (e) {
        console.log('form submit event!');
        console.log('e:', e);

        //get the inputs: 
        const groupId = Number($(this).attr('id'));
        const email = $(this).find('input[name="email"]').val();
        console.log(`groupId: ${groupId} | email: ${email}`);

        //validate the inputs:
        if (!email || $.type(email) !== 'string' || !emailRegEx.test(email)) {
            response.message.push('[email] is invalid or missing! expecting a valid email string!');
        }

        if (!e.groupId || $.type(groupId) !== 'string' || !groupIdRegEx.test(groupId)) {
            response.message.push('[groupId] is invalid or missing! expecting one or more numbers separated by comma!');
        }

        if (!response.success) {
            return printResponse(response);
        }

        //send the inputs to the API and handle its response:
        sendUserToAPI(groupId, email, function (response) {
            console.log('API response:', response);

            printResponse(response);
        });

    });

    console.groupEnd('listenToCourseLeadsForm');
}



function sendUserToAPI(groupId, email, callback) {
    //console.trace();
    console.group('sendUserToAPI');
    console.log('groupId:', groupId);
    console.log('email:', email);

    let retryTimes = 3;
    let retryInterval = 1000;

    function sendRequest() {
        const url = `${API_endpoint}?groupId=${groupId}&email=${email}`;

        fetch(url, {method: 'HEAD'})
                .then(function (headResponse) {
                    if (!headResponse.ok) {
                        throw new Error(`Server response is NOT ok! status: ${headResponse.status}`);
                    }
                    return fetch(url, {method: 'GET', cache: 'no-cache'});
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
    let $responseEl = $($form).find('.block__email_leads__response');
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


    if (!response || !Object.keys(response).length) {
        console.error('[response] argument is invalid or missing! expecting a non-empty object!');
        responseType = 'fail';
        message = 'Internal server error!';

    } else {
        responseType = (response.success) ? 'success' : 'fail';
        message = (function () {
            if (!response.message || !response.message.length) {
                return 'Internal server error!';
            }
            return '<ul><li>' + response.message.join('</li>') + '</ul>';
        }());
    }

    let styleString = (function () {
        let string;
        for (let key in style[responseType]) {
            string += `${key}: ${style[responseType][key]}; `;
        }
        return string;
    }());

    let html = `
    <div class="${responseType}" 
         style="margin: 1em; padding: 1em; border-radius: 0.5em; ${styleString}"> 
            ${message}
    </div>
`;

    $($responseEl).html(html);

    console.groupEnd('printResponse');

}



