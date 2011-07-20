﻿window.$_MICRO_WIKI_GLOBALS = {

    CHILD_MENU_HTML: ''

};

function ajaxPostRequest(requestUrl, postData, successCallback, errorCallback) {

    $.ajax({
        url: requestUrl,
        dataType: 'json',
        data: postData,
        type: 'post',
        success: successCallback,
        error: errorCallback
    });

}

function genericErrorCallback(request, status, error) {

    alert('Error loading page data! Error: ' + error);

}

$(function () {

    $('.edit-link').bind('click', function (event) {

        event.preventDefault();

        var url = $(this).attr('href').substring(1);

        ajaxPostRequest('/get',
                        {
                            location: url
                        },
                        function (data, status, request) {

                            var form = '<form action="/update" method="post" id="edit-form">' +
                                           '<p>root/<input name="location" type="text" value="' + url + '" /></p>' +

                                           '<div id="wmd-editor" class="wmd-panel">' +
			                                   '<div id="wmd-button-bar"></div>' +
			                                   '<textarea id="wmd-input"></textarea>' +
		                                   '</div>' +
		                                   '<div id="wmd-preview" class="wmd-panel"></div>' +
		                                   '<div id="wmd-output" class="wmd-panel"></div>' +

                                           // '<p><textarea name="body">' + data.body + '</textarea></p>' +
                                           '<p><input name="id" type="hidden" value="' + data.id + '" />' +
                                           '<input type="submit" value="Save" /></p>' +
                                       '</form>';

                            if ($('#children').length)
                                $_MICRO_WIKI_GLOBALS.CHILD_MENU_HTML = '<div id="children">' + $('#children').html() + '</div>';

                            $('#content').html(form);

                            

                        },
                        genericErrorCallback);

    });

    $('#edit-form').live('submit', function (event) {

        event.preventDefault();

        ajaxPostRequest('/update',
                        {
                            id: $('#edit-form input[name=id]').val(),
                            location: $('#edit-form input[name=location]').val(),
                            body: $('#edit-form textarea[name=body]').val()
                        },
                        function (data, status, request) {

                            var url = "root/" + window.location.pathname.substring(1);

                            if (url != "root/" && data.updatedLocation != url)
                                window.location.href = data.updatedLocation.substring(4);

                            $('#content').html($_MICRO_WIKI_GLOBALS.CHILD_MENU_HTML + data.updatedBody);

                        },
                        genericErrorCallback);

    });

    $('.add-link').bind('click', function (event) {

        event.preventDefault();

        var url = $(this).attr('href').substring(1);

        var form = '<form action="/insert" method="post" id="add-form">' +
                        '<p>root/<input name="location" type="text" value="' + url + '" /></p>' +
                        '<p><textarea name="body"></textarea></p>' +
                        '<p><input type="hidden" name="redirect" value="1" />' +
                        '<input type="submit" value="Save" /></p>' +
                    '</form>';

        $('#content').html(form);

    });

    $('.delete-link').bind('click', function (event) {

        event.preventDefault();

        if (confirm('Are you sure you want to delete this page?')) {

            ajaxPostRequest('/delete',
                            {
                                location: $(this).attr('href').substring(1)
                            },
                            function (data, status, request) {

                                if (data.deleted) window.location.href = '/';

                            },
                            genericErrorCallback);

        }

    });

});