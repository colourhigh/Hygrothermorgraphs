$(document).ready(function() {
    var coil_state;
    var position = 0;
    var timeout;
    var waiting;
    var program = [];
    var stack = [];
    var pc = 0;
    var source_map = [];

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
        var nums = [];
        for (var i = 0; i < source_map[pc]; i++) {
            nums.push('');
        }
        nums.push('here');
        output.html(nums.join('<br/>'));;
    }

    function loop() {
        console.log(pc, program[pc]);
        switch (program[pc++]) {

            case "on":
                send(true);
                timeout = setTimeout(loop, program[pc++] * 1000);
                break;
            case "off":
                send(false);
                timeout = setTimeout(loop, program[pc++] * 1000);
                break;
            case "func":
                while (program[pc++] !== 'end') {}
                loop();
                break;
            case "goto":
                stack.push(pc + 1);
                pc = program[pc];
                loop();
                break;
            case "end":
                pc = stack.pop();
                loop();
                break;
            case "stop":
                output.html('finished');
                break;
        }
    }

    function start() {
        loop();

    }

    function pause() {
        clearTimeout(timeout);
    }

    function reset() {
        pc = 0;
        stak = [];
        output.html('');
    }

    function save() {
        localStorage['commands'] = textarea.val();
    }

    function load() {
        pause();
        reset();
        textarea.val(localStorage['commands']);
        input_update();
    }

    function input_update() {
        var textLines = textarea.val().trim().split(/\r*\n/).length;
        textarea.height(textLines * 17 + 40);
        output.height(textLines * 17 + 40);
        line_numbers.height(textLines * 17 + 40);
        var nums = [];
        for (var i = 0; i < textLines + 1; i++) {
            nums.push(i + 1);
        }
        line_numbers.html(nums.join('<br/>'));
        parse();
    }

    function parse() {
        program = [];
        var status = [];
        var funcs = [];
        var lines = textarea.val().split(/\r*\n/);

        lines.forEach(function(line, i) {
            var start_length = program.length;
            var tokens = line.replace(/^\s+|\s+$/g, '').split(/ +/);
            var num;
            var error = '';
            switch (tokens[0]) {
                case 'on':
                case 'off':
                case 'push':
                case 'pop':
                    program.push(tokens[0]);
                    num = parseFloat(tokens[1]);
                    if (!Number.isNaN(num)) {
                        program.push(tokens[1]);
                    } else {
                        error = 'error, bad number';
                    }
                    break;
                case 'func':
                    program.push(tokens[0]);
                    funcs[tokens[1]] = program.length;
                    break;
                case 'end':
                    program.push(tokens[0]);
                    break;
                case 'call':
                    program.push('goto');
                    if (funcs[tokens[1]]) {
                        program.push(funcs[tokens[1]]);
                    } else {
                        error = 'error, bad function call';
                    }
                    break;
                case '':
                    break;
                default:
                    error = "error, unknown"
            }
            status.push(error);
            for (var k = 0; k < program.length - start_length; k++) {
                source_map.push(i);
            }
        });
        program.push('stop');
        console.log(program);
        output.html(status.join('<br/>'));
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

    var line_numbers = $('<div/>')
        .css({
            width: '40px',
            height: '100%',
            backgroundColor: '#efefef',
            padding: '6px',
            fontSize: '17px',
            fontFamily: 'monospace',
            lineHeight: '17px',
            float: 'left',
            border: '1px solid #A9A9A9',
            borderWidth: '1px 0 1px 1px'
        })
        .appendTo(pane);
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
        .on('keyup', input_update)
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