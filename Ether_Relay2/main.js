$(document).ready(function() {
    var _temp_map;
    var _alphabet;
    var arduinoIP = '192.168.1.69';


    if (typeof temp_map === "undefined") {
        _temp_map = [
            [1.0, 0.1, 20],
            [16.75, 1.2, 4],
            [25.1, 1, 4],
            [37.2, 2, 2],
            [38.7, 3, 4],
            [44.0, 4, 2]
        ];
    } else {
        _temp_map = temp_map;
    }
    if (typeof alphabet === 'undefined') {
        _alphabet = {
            A: {
                low: function(machine) {
                    machine.temp(0, 20);
                    machine.temp_tween(0, 50, 40);
                    machine.temp(50, 20);
                    machine.temp_tween(50, 0, 40);
                    machine.temp(0, 20);
                    return 'low';
                }
            }
        };
    } else {
        _alphabet = alphabet;
    }


    function getTemp(temp) {
        for (var i = 0; i < _temp_map.length; i++) {
            if (_temp_map[i][0] > temp) {
                return [_temp_map[Math.max(i - 1, 0)][1], _temp_map[Math.max(i - 1, 0)][2]];
            }
        }
        return [_temp_map[_temp_map.length - 1][1], _temp_map[_temp_map.length - 1][2]];
    }

    function getFloat(input) {
        var float = parseFloat(input);
        if (Number.isNaN(float)) {
            throw 'error, bad number';
        }
        return float;
    }

    function formatDuration(seconds) {
        var hours = parseInt(seconds / 3600, 10);
        var minutes = parseInt(seconds / 60, 10) % 60;
        return hours + ' hours ' + minutes + ' minutes ' + (seconds % 60).toFixed(1) + ' seconds';
    }

    var Machine = function(machine_index) {
        this.pc = 0;
        this.program = [];
        this.stack = [];
        this.source_map = [];
        this.state = {};
        this.machine_index = machine_index;
    }

    Machine.prototype.clone = function() {
        var m = new Machine(this.machine_index);
        m.program = this.program.slice();
        m.source_map = this.source_map.slice();
        return m;
    }

    Machine.prototype.tween = function(on1, off1, on2, off2, steps) {
        on1 = getFloat(on1);
        on2 = getFloat(on2);
        off1 = getFloat(off1);
        off2 = getFloat(off2);
        steps = getFloat(steps);
        for (var i = 0; i < steps; i++) {
            this.program.push('heat_on');
            this.program.push(on1 + (on2 - on1) / steps * i);
            this.program.push('heat_off');
            this.program.push(off1 + (off2 - off1) / steps * i);
        }
    }

    Machine.prototype.temp = function(temp, duration) {
        duration *= 60;
        var pair = getTemp(temp);
        var length = pair[0] + pair[1];
        for (var i = 0; i < duration; i += length) {
            [].push.apply(this.program, ['heat_on', pair[0], 'heat_off', pair[1]]);
        }
    }

    Machine.prototype.temp_tween = function(temp1, temp2, duration) {
        duration *= 60;
        var pair1 = getTemp(temp1);
        var pair2 = getTemp(temp2);
        var ave_duration = (Math.abs(pair1[0] + pair1[1]) / 2 + Math.abs(pair2[0] + pair2[1]) / 2);
        // tween is responsible for most of the error in timing
        this.tween(pair1[0], pair1[1], pair2[0], pair2[1], duration / ave_duration);
    };


    Machine.prototype.process_word = function(word) {
        var position = 'low';
        word = word.toUpperCase();
        var i = 0,
            j, found;
        while (i < word.length) {
            found = false;
            for (var j = word.length; j > i; j--) {
                var str = word.substring(i, j);
                if (_alphabet[str] && _alphabet[str][position]) {
                    position = _alphabet[str][position](this);
                    i = j;
                    found = true;
                    break;
                }
            }
            if(!found){
                position = position === 'low' ? 'high': 'low';
                for (var j = word.length; j > i; j--) {
                    var str = word.substring(i, j);
                    if (_alphabet[str] && _alphabet[str][position]) {
                        position = _alphabet[str][position](this);
                        i = j;
                        found = true;
                        break;
                    }
                }
            }
            if (!found) {
                throw 'could not process word';
            }
        }
    }


    var update = function(state, machine) {
        var xhr;
        state = state || {};
        state.s = machine.machine_index + 1;
        xhr = $.get('http://' + arduinoIP + '/ajax', state);

        xhr.done(function(data) {
            machine.state = data.state;
            $('.status .heat').text('Heat: ' + machine.state.heat)
                .css({
                    'color': (machine.state.heat !== 'on') ? 'green' : 'red'
                });
            $('.status .heat').text('Heat: ' + machine.state.cool)
                .css({
                    'color': (machine.state.cool !== 'on') ? 'green' : 'red'
                });
            $('.status .temperature').text('Temperature: ' + machine.state.temperature);

        })
    };

    function run(send, machine) {
        loop: while (machine.def.state() !== 'resolved') {
            switch (machine.program[machine.pc++]) {
                case "heat_on":
                    send({
                        heat: 'on'
                    }, machine.program[machine.pc], machine);
                    machine.timeout = setTimeout(run.bind(null, send, machine), machine.program[machine.pc++] * 1000);
                    break loop;
                case "heat_off":
                    send({
                        heat: 'off'
                    }, machine.program[machine.pc], machine);
                    machine.timeout = setTimeout(run.bind(null, send, machine), machine.program[machine.pc++] * 1000);
                    break loop;
                case "cool_on":
                    send({
                        cool: 'on'
                    }, machine.program[machine.pc], machine);
                    machine.timeout = setTimeout(run.bind(null, send, machine), machine.program[machine.pc++] * 1000);
                    break loop;
                case "cool_off":
                    send({
                        cool: 'off'
                    }, machine.program[machine.pc], machine);
                    machine.timeout = setTimeout(run.bind(null, send, machine), machine.program[machine.pc++] * 1000);
                    break loop;
                case "func":
                    while (machine.program[machine.pc++] !== 'end' && machine.pc < machine.program.length) {}
                    break;
                case "goto":
                    machine.stack.push(machine.pc + 1);
                    machine.pc = machine.program[machine.pc];
                    break;
                case "end":
                    machine.pc = machine.stack.pop();
                    break;
                case "stop":
                default:
                    machine.pc = 0;
                    machine.def.resolve();


            }
        }
    }

    function simulate(machine) {
        machine.duration = 0;
        finished = false;
        while (!finished) {
            switch (machine.program[machine.pc++]) {
                case "heat_on":
                case "heat_off":
                case "cool_on":
                case "cool_off":
                    machine.duration += machine.program[machine.pc++];
                    break;
                case "func":
                    while (machine.program[machine.pc++] !== 'end' && machine.pc < machine.program.length) {}
                    break;
                case "goto":
                    machine.stack.push(machine.pc + 1);
                    machine.pc = machine.program[machine.pc];
                    break;
                case "end":
                    machine.pc = machine.stack.pop();
                    break;
                case "stop":
                default:
                    console.log(machine.program[machine.pc - 1]);
                    finished = true;
            }
        }
        console.log(machine.program)
        return machine;
    }
        function parse(machine_index, lines, output) {
            var machine = new Machine(machine_index);
            var status = [];
            var funcs = [];
            var errored = false;
            lines.forEach(function(line, i) {
                var start_length = machine.program.length;
                var tokens = line.replace(/^\s+|\s+$/g, '').split(/ +/);
                var num;
                try {
                    switch (tokens[0]) {
                        case 'on':
                        case 'off':
                            machine.program.push('heat_' + tokens[0]);
                            num = getFloat(tokens[1]);
                            machine.program.push(num);
                            break;
                        case 'push':
                        case 'pop':
                            machine.program.push(tokens[0]);
                            num = getFloat(tokens[1]);
                            machine.program.push(num);
                            break;
                        case 'cool':
                            machine.program.push('cool_on');
                            num = getFloat(tokens[1]);
                            machine.program.push(num);
                            machine.program.push('cool_off');
                            machine.program.push(0);
                            break;
                        case 'func':
                            machine.program.push(tokens[0]);
                            funcs[tokens[1]] = machine.program.length;
                            break;
                        case 'end':
                            machine.program.push(tokens[0]);
                            break;
                        case 'call':
                            machine.program.push('goto');
                            if (funcs[tokens[1]]) {
                                machine.program.push(funcs[tokens[1]]);
                            } else {
                                throw 'error, bad function call';
                            }
                            break;
                        case 'loop':
                            var count = getFloat(tokens[2]) | 0;
                            for (var j = 0; j < count; j++) {
                                machine.program.push('goto');
                                if (funcs[tokens[1]]) {
                                    machine.program.push(funcs[tokens[1]]);
                                } else {
                                    throw 'error, bad function call';
                                }
                            }
                            break;
                        case 'tween':
                            machine.tween.apply(machine, tokens.slice(1, tokens.length));
                            break;
                        case 'temp':
                            machine.temp(getFloat(tokens[1]), getFloat(tokens[2]));
                            break;
                        case 'temp_tween':
                            machine.temp_tween(getFloat(tokens[1]), getFloat(tokens[2]), getFloat(tokens[3]));
                            break;
                        case 'letter':
                            var letter = tokens[1].toUpperCase();
                            if (!_alphabet[letter]) {
                                throw 'unknown letter';
                            }
                            (_alphabet[letter].low || _alphabet[letter].high)(machine);
                            break;
                        case 'word':
                            machine.process_word(tokens[1])
                            break;
                        case '':
                            break;
                        default:
                            throw "error, unknown"
                    }
                    for (var k = 0; k < machine.program.length - start_length; k++) {
                        machine.source_map.push(i);
                    }
                    status.push('');
                } catch (error) {
                    errored = true;
                    status.push(error);
                }
            });
            machine.program.push('stop');
            if(output)
                output.html(status.join('<br/>'));
            if (!errored) {
                machine.duration = simulate(machine.clone()).duration;
                var duration = formatDuration(machine.duration);
                console.log('Total duration: ', duration);
                if(output)
                    output.append(duration);
            }
            return machine;
        }

    var outputs = ['s1', 's2', 's3'].map(function(s, machine_index) {
        var waiting;
        var machine = new Machine(machine_index);

        function send(state, delay, machine) {
            if (waiting) waiting.remove();
            update(state, machine);
            var nums = [];
            for (var i = 0; i < machine.source_map[machine.pc]; i++) {
                nums.push('');
            }
            nums.push('here, ' + (state.heat || state.cool) + ': waiting ' + delay.toFixed(2));
            output.html(nums.join('<br/>'));;
        }

        function start() {
            machine.def = $.Deferred();
            machine.def
                .then(function() {
                    output.html('finished');
                });
            run(send, machine)
        }

        function pause(off) {
            clearTimeout(machine.timeout);
            if (off) {
                update({
                    heat: 'off',
                    cool: 'off'
                }, machine);
            }
            var nums = [];
            for (var i = 0; i < machine.source_map[machine.pc]; i++) {
                nums.push('');
            }
            nums.push('here, paused');
            output.html(nums.join('<br/>'));;
        }

        function reset() {
            machine.pc = 0;
            machine.stack = [];
            output.html('');
        }

        function save() {
            localStorage['commands'] = textarea.val();
        }

        function load() {
            pause();
            reset();
            textarea.val(localStorage['commands']);
            inputUpdate();
        }

        function inputUpdate() {
            var textLines = textarea.val().trim().split(/\r*\n/).length;
            textarea.height(textLines * 17 + 40);
            output.height(textLines * 17 + 40);
            line_numbers.height(textLines * 17 + 40);
            var nums = [];
            for (var i = 0; i < textLines + 1; i++) {
                nums.push(i + 1);
            }
            line_numbers.html(nums.join('<br/>'));
            pause();
            machine = parse(machine_index, textarea.val().split(/\r*\n/), output);
        }

        var wrapper = $('<div/>').css({
            width: '33%',
            float: 'left'
        }).appendTo('#main');

        $('<div/>')
            .attr({
                'class': 'status'
            })
            .appendTo(wrapper)
            .append($('<div/>').addClass('heat').text('Heat: unknown'))
            .append($('<div/>').addClass('cool').text('Cool: unknown'))
            .append($('<div/>').addClass('temperature').text('Temperature: unknown'))
            .css({
                'font-size': '19px',
                'font-family': 'monospace',
                'text-align': 'center'
            });

        var buttons = $('<div/>')
            .attr({
                id: 'buttons'
            })
            .appendTo(wrapper)
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
            .on('click', function() {
                update({
                    heat: 'on'
                }, machine);
            })
            .appendTo(buttons);

        $('<input/>')
            .attr({
                type: 'button',
                value: 'off',
                class: 'btn'
            })
            .on('click', function() {
                update({
                    heat: 'off'
                }, machine);
            })
            .appendTo(buttons);


        var button_bar = $('<div/>')
            .addClass('buttons')
            .css({
                padding: '10px'
            })
            .appendTo(wrapper);

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
            .appendTo(wrapper);

        var line_numbers = $('<div/>')
            .css({
                width: '30px',
                height: '100%',
                backgroundColor: '#efefef',
                padding: '6px',
                fontSize: '13px',
                fontFamily: 'monospace',
                lineHeight: '13px',
                float: 'left',
                border: '1px solid #A9A9A9',
                borderWidth: '1px 0 1px 1px'
            })
            .appendTo(pane);
        var textarea = $('<textarea/>')
            .css({
                width: 'calc(40% - 30px)',
                padding: '6px',
                fontSize: '13px',
                fontFamily: 'monospace',
                lineHeight: '13px',
                float: 'left',
                resize: 'none',
                border: '1px solid #A9A9A9'
            })
            .on('keyup', inputUpdate)
            .appendTo(pane);

        var output = $('<div/>')
            .addClass('output_state')
            .css({
                width: 'calc(40% - 30px)',
                height: '100%',
                backgroundColor: '#efefef',
                padding: '6px',
                fontSize: '13px',
                fontFamily: 'monospace',
                lineHeight: '13px',
                float: 'left',
                border: '1px solid #A9A9A9',
                borderWidth: '1px 1px 1px 0'
            })
            .addClass('output')
            .appendTo(pane);

        textarea.trigger('keyup')

        return {
            start: start,
            pause: pause,
            textarea: textarea
        }
    });

    var startAll = function() {
        outputs.forEach(function(o) {
            o.start();
        })
    }

    var pauseAll = function() {
        outputs.forEach(function(o) {
            o.pause(true);
        })
    }

    var timeSelect = function() {
        var select = $('<select/>');
        for (var i = 0; i < 24; i++) {
            for (var j = 0; j < 4; j++) {
                select.append($('<option/>').val(i + ':' + (j * 15)).text(i + ':' + ('0' + (j * 15)).substr(-2)));
            }
        }
        return select;
    }

    var timerUpdate = function() {
        var now = new Date();
        if ((now.getHours() > startTime[0] || (now.getHours() === startTime[0] && now.getMinutes() > startTime[1])) &&
            (now.getHours() < endTime[0] || (now.getHours() === endTime[0] && now.getMinutes() < endTime[1]))) {
            timerStatus.text('Running');
            if (!running && ready) {
                startAll();
                running = true;
            }
        } else {
            timerStatus.text('Sleeping');
            if (running) {
                pauseAll();
                running = false;
            }
        }
    }

    var timers = $('<div/>').prependTo('#main');
    var running = false;
    var ready = false;
    var timerStatus = $('<span/>');
    var ipInput = $('<input/>').val(arduinoIP)
        .on('keyup', function() {
            arduinoIP = $(this).val();
        });
    var startTime = [0, 0];
    var endTime = [0, 0];
    var startSelect = timeSelect()
        .val('9:0')
        .on('change', function() {
            startTime = [$(this).val().split(':')[0] | 0, $(this).val().split(':')[1] | 0];
            timerUpdate();
        })
        .trigger('change');

    var endSelect = timeSelect()
        .val('17:0')
        .on('change', function() {
            endTime = [$(this).val().split(':')[0] | 0, $(this).val().split(':')[1] | 0];
            timerUpdate();
        })
        .trigger('change');

    var timerCSS = {
        paddingLeft: '20px',
    }

    timers.css({
        textAlign: 'center',
        width: '100%',
        padding: '20px 0 20px 0',
        fontSize: '18px',
        fontFamily: 'monospace'
    })
        .append($('<div/>').append('Arduino IP').append(ipInput))
        .append($('<div/>').append('Timer Status:').append(timerStatus))
        .append($('<span/>').append('Start Time').append(startSelect).css(timerCSS))
        .append($('<span/>').append('Finish Time').append(endSelect).css(timerCSS))

    var timerInterval = setInterval(timerUpdate, 1000);

    $.get('/json/schedule/ip')
        .done(function(data) {
            ipInput.val(data.ip).trigger('keyup');
        })
    $.get('/json/schedule/entries')
        .done(function(data) {
            var d = new Date();
            var date = d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear();
            for (var i = 0; i < data.length; i++) {
                if (data[i].date === date) {
                    startSelect.val(data[i].start).trigger('change');
                    endSelect.val(data[i].end).trigger('change');
                    data[i].values.forEach(function(v, i) {
                        //time to get smarter

                        var result = v.split(' ').map(function(v) {
                            return v ? 'word ' + v  : '';
                        });
                        var machine = parse(-1, result);
                        var total_seconds = (endTime[0]*3600  + endTime[1]*60) - (startTime[0]*3600  + startTime[1]*60);
                       if(total_seconds > machine.duration){
                           var cool_time = (total_seconds - machine.duration)/2;
                        result.unshift('cool ' + cool_time);
                        result.push('cool ' + cool_time );
                       }


                        outputs[i].textarea.val(result.join('\n')).trigger('keyup');
                    });

                }
            }
        })
        .always(function() {
            if (location.search.indexOf('no_auto_start') === -1) {
                ready = true;
            }
        });

    (function refreshAt(hours, minutes, seconds) {
        var now = new Date();
        var then = new Date();

        if (now.getHours() > hours ||
            (now.getHours() == hours && now.getMinutes() > minutes) ||
            now.getHours() == hours && now.getMinutes() == minutes && now.getSeconds() >= seconds) {
            then.setDate(now.getDate() + 1);
        }
        then.setHours(hours);
        then.setMinutes(minutes);
        then.setSeconds(seconds);
        var timeout = (then.getTime() - now.getTime());
        setTimeout(function() {
            window.location.reload(true);
        }, timeout);
    })(6, 0, 0);

    var cover = $('<div/>').css({position: 'absolute', width: '100%', height: '100%', left: 0, top: 0,
        background: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAGklEQVQIW2NkYGD4D8SMQAwGcAY2AbBKDBUAVuYCBQPd34sAAAAASUVORK5CYII=)'}).appendTo('body');
    var danger = $('<button>Only press in an emergency</button>').css({position: 'absolute', top: '70%', left: '45%', fontSize: '18px'}).appendTo('body').on('click', function(){
        cover.remove();
        danger.remove();
    });
});