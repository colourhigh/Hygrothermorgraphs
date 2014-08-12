$(document).on('ready', function() {
    "use strict";

    var days = 40;

    var timeSelect = function() {
        var select = $('<select/>');
        for (var i = 0; i < 24; i++) {
            for (var j = 0; j < 4; j++) {
                select.append($('<option/>').val(i + ':' + (j * 15)).text(i + ':' + ('0' + (j * 15)).substr(-2)));
            }
        }
        return select;
    }

    var localeDateString = function(d) {
        return d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear();
    }

    function generateBlock(date, count) {
        var template = $('<div data-date="' + localeDateString(date) + '" class="entry"><span class="date">' + localeDateString(date) + '</span><div class="times"></div><table><tr></tr><tr></tr></table></div>');

        template.find('.times')
            .append($('<span/>').append('Start Time').append(timeSelect().val('9:0')))
            .append($('<span/>').append('Finish Time').append(timeSelect().val('17:0')))

        for (var i = 0; i < count; i++) {
            template.find('table tr:first').append('<th>Sculpture ' + (i + 1) + '</td>');
            template.find('table tr:last').append('<td><textarea></textarea></td>');
        }
        return template;
    }



    for (var i = 0; i < days; i++) {
        var date = new Date();
        date.setDate(date.getDate() + i)
        $('#main').append(generateBlock(date, 3))

    }
    var ip = $('#ip');
    $('#save').on('click', function() {

        var data = $('.entry').map(function() {
            var $this = $(this);

            return {
                ip: ip.val(),
                date: $(this).attr('data-date'),
                start: $(this).find('select:first').val(),
                end: $(this).find('select:last').val(),
                values: $this.find('textarea').map(function() {
                    return $(this).val();
                }).toArray()
            }
        }).toArray();
        $.post('/json/schedule', {
            data: JSON.stringify(data)
        });
    });

    $.get('/json/schedule')
        .then(function(data) {
            data.forEach(function(d) {
                ip.val(d.ip || '10.1.1.50');
                var div = $('div[data-date="' + d.date + '"]');
                if (d.start) {
                    div.find('select:first').val(d.start);
                }
                if (d.end) {
                    div.find('select:last').val(d.end);
                }
                d.values.forEach(function(v, i) {
                    div.find('textarea').eq(i).val(v);
                });
            });
        });
});