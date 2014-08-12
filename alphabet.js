$(document).ready(function() {

    var input = $('.code');

    $.get('/json/alphabet')
        .done(function(data) {
            input.val(data.code);
        });

    $('#save').on('click', function() {
        var data = {
            code: input.val()
        };
        try {
            eval(data.code);

            $.post('/json/alphabet', {
                data: JSON.stringify(data)
            })
                .then(function() {
                    $('.status .saved').finish().show().fadeOut(3000);
                }, function() {
                    $('.status .error').finish().show().fadeOut(3000);
                });
        } catch (e) {
            $('.status .error').finish().show().fadeOut(3000);
        }
    });

});