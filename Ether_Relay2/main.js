$(document).ready(function() {

    var coil_state;
    var position = 0;
    var timeout;
    var data = [];
    var waiting;

    var update = function(state) {
        var xhr;
        if (state !== undefined) {
            xhr = $.get('/ajax?output=' + (state ? 'on' : 'off'));
        } else {
            xhr = $.get('/ajax');
        }
        xhr.done(function(data) {
            coil_state = data.state === 'on';
            $('.status .state').text('State: ' + data.state);
            $('.status .temperature').text('Temperature: ' + data.temperature);
            $('.status').css({
                'color': coil_state ? 'green' : 'red'
            });
        })
    };

    function send(state) {
        if (waiting) waiting.remove();
        update(state);
        output.append($('<div/>').text('Sent').css({
            color: 'green'
        }));
    }

    function loop() {
        while ((position < data.length) && ['on', 'off'].indexOf(data[position][0]) === -1) {
            if (waiting) waiting.remove();
            output.append($('<div/>').text('Bad Line').css({
                color: 'red'
            }));
            position++;
        }
        if (position < data.length) {
            send(data[position][0] === 'on');
        }
        if (position < data.length - 1) {
            timeout = setTimeout(function() {
                loop();
            }, data[position][1] * 1000)
            waiting = $('<div/>').text('Waiting...').css({
                color: 'blue'
            }).appendTo(output);
        } else {
            console.log('End of input');
        }
        position++;
    }

    function start() {
        loop();

    }

    function pause() {
        clearTimeout(timeout);
    }

    function reset() {
        position = 0;
        output.html('');
    }

    function save() {
        localStorage['commands'] = textarea.val();
    }

    function load() {
        pause();
        reset();
        textarea.val(localStorage['commands']).trigger('change');

    }

    function parse() {
        data = textarea.val().split(/\r*\n/).map(function(line) {
            var parts = line.replace(/^\s+|\s+$/g).split(/ +/);
            return [parts[0], parts[1] | 0];
        });

    }



    $('<div/>')
        .attr({
            'class': 'status'
        })
        .appendTo('#main')
        .append($('<div/>').addClass('state').text('State: unknown'))
        .append($('<div/>').addClass('temperature').text('Temperature: unknown'))
        .css({
            'font-size': '30px',
            'font-family': 'monospace',
            'text-align': 'center'
        });

    $('<div/>')
        .attr({
            id: 'buttons'
        })
        .appendTo('#main')
        .css({
            'text-align': 'center',
            'padding': '10px',
            'font-size': '20px'
        });
    $('<input/>')
        .attr({
            type: 'button',
            value: 'on',
            class: 'btn'
        })
        .on('click', update.bind(null, true))
        .appendTo('#buttons');

    $('<input/>')
        .attr({
            type: 'button',
            value: 'off',
            class: 'btn'
        })
        .on('click', update.bind(null, false))
        .appendTo('#buttons');


    var button_bar = $('<div/>')
        .addClass('buttons')
        .css({
            width: '100%',
            padding: '10px'
        })
        .appendTo('body');

    $('<input/>')
        .attr({
            type: 'button',
            value: 'start'
        })
        .appendTo(button_bar)
        .on('click', start);
    $('<input/>')
        .attr({
            type: 'button',
            value: 'pause'
        })
        .appendTo(button_bar)
        .on('click', pause);
    $('<input/>')
        .attr({
            type: 'button',
            value: 'reset'
        })
        .appendTo(button_bar)
        .on('click', reset);
    $('<input/>')
        .attr({
            type: 'button',
            value: 'save'
        })
        .appendTo(button_bar)
        .on('click', save);
    $('<input/>')
        .attr({
            type: 'button',
            value: 'load'
        })
        .appendTo(button_bar)
        .on('click', load);

    var pane = $('<div/>')
        .addClass('pane')
        .css({
            width: '100%'
        })
        .appendTo('body');

    var textarea = $('<textarea/>')
        .css({
            width: '30%',
            padding: '6px',
            fontSize: '17px',
            fontFamily: 'monospace',
            lineHeight: '17px',
            float: 'left',
            resize: 'none',
            border: '1px solid #A9A9A9'
        })
        .on('keyup', function() {
            var textLines = $(this).val().trim().split(/\r*\n/).length;
            $(this).height(textLines * 17 + 40);
            $('.output_state').height(textLines * 17 + 40);
            parse();
        })
        .appendTo(pane);

    var output = $('<div/>')
        .addClass('output_state')
        .css({
            width: '50%',
            height: '100%',
            backgroundColor: '#efefef',
            padding: '6px',
            fontSize: '17px',
            fontFamily: 'monospace',
            lineHeight: '17px',
            float: 'left',
            border: '1px solid #A9A9A9',
            borderWidth: '1px 1px 1px 0'
        })
        .addClass('output')
        .appendTo(pane);

    textarea.trigger('keyup')


    update();
});