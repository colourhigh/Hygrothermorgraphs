$(document).ready(function() {

	var temp_map = [
        [1.0, 0.1, 20],
		[16.75, 1.2, 4],
		[25.1, 1, 4],
		[37.2, 2, 2],
		[38.7, 3, 4],
		[44.0, 4, 2]
	];



    var alphabet = {
        A: {
            low: function(machine){
                machine.temp(0, 20);
                machine.temp_tween(0, 50, 40);
                machine.temp(50, 20);
                machine.temp_tween(50, 0, 40);
                machine.temp(0, 20);
                return 'low';
            }
        },
        H: {
            low: function(machine){
                machine.temp(0, 20);
                machine.temp(50, 5);
                machine.temp(35, 50);
                machine.temp(50, 5);
                machine.temp(0, 20);
                return 'low';
            },
            high: function(machine){
                machine.temp(50, 20);
                machine.temp(0, 15);
                machine.temp(35, 50);
                machine.temp(0, 15);
                machine.temp(50, 20);
                return 'high';
            }
        },
        L: {
            low: function(machine){
                machine.temp(0, 20);
                machine.temp(50, 15);
                machine.temp(0, 15);
                return 'low';
            },
            high: function(machine){
                machine.temp(50, 2);
                machine.temp(0, 15);
                machine.temp(50, 25);
                return 'high';
            }
        }
    }


    function getTemp(temp){
        for(var i=0; i < temp_map.length; i++){
            if(temp_map[i][0] > temp){
                return [temp_map[Math.max(i-1, 0)][1], temp_map[Math.max(i-1, 0)][2]];
            }
        }
        return [temp_map[temp_map.length-1][1], temp_map[temp_map.length-1][2]];
    }

    var Machine = function(){
        this.pc = 0;
        this.program = [];
        this.stack = [];
        this.source_map = [];
        this.state = {};
    }

    Machine.prototype.clone = function(){
        var m = new Machine();
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
            this.program.push('on');
            this.program.push(on1 + (on2 - on1) / steps * i);
            this.program.push('off');
            this.program.push(off1 + (off2 - off1) / steps * i);
        }
    }

    Machine.prototype.temp = function(temp, duration) {
        duration *= 60;
        var pair = getTemp(temp);
        var length = pair[0] + pair[1];
        for(var i=0; i < duration; i+=length){
            [].push.apply(this.program, ['on', pair[0], 'off', pair[1]]);
        }
    }

    Machine.prototype.temp_tween = function(temp1, temp2, duration){
        duration *=60;
         var pair1 = getTemp(temp1);
        var pair2 = getTemp(temp2);
        var ave_duration = (Math.abs(pair1[0]+pair1[1])/2 + Math.abs(pair2[0]+pair2[1])/2);
        // tween is responsible for most of the error in timing
        machine.tween(pair1[0], pair1[1], pair2[0], pair2[1], duration/ave_duration);
    }

    var timeout;
    var waiting;
    var machine = new Machine();

    var update = function(state, machine) {
        var xhr;
        if (state !== undefined) {
            xhr = $.get('/ajax', state);
        } else {
            xhr = $.get('/ajax');
        }
        xhr.done(function(data) {
            machine.state = data.state;
            $('.status .heat').text('Heat: ' + machine.state.heat)
                .css({
                'color': ( machine.state.heat !== 'on') ? 'green' : 'red'
                });
            $('.status .heat').text('Heat: ' + machine.state.cool)
                .css({
                'color': ( machine.state.cool !== 'on') ? 'green' : 'red'
                });
            $('.status .temperature').text('Temperature: ' + machine.state.temperature);

        })
    };

    function send(state, delay, machine) {
        if (waiting) waiting.remove();
        update(state, machine);
        var nums = [];
        for (var i = 0; i < machine.source_map[machine.pc]; i++) {
            nums.push('');
        }
        nums.push('here, ' +  (state.heat || state.cool ) + ': waiting ' + delay.toFixed(2));
        output.html(nums.join('<br/>'));;
    }

    function run(send, machine) {
        loop:
        while(machine.def.state() !== 'resolved'){
            switch (machine.program[machine.pc++]) {
                case "heat_on":
                    send({heat: 'on'}, machine.program[machine.pc], machine);
                    machine.timeout = setTimeout(run.bind(null, send, machine), machine.program[machine.pc++] * 1000);
                    break loop;
                case "heat_off":
                    send({heat: 'off'}, machine.program[machine.pc], machine);
                    machine.timeout = setTimeout(run.bind(null,  send, machine), machine.program[machine.pc++] * 1000);
                    break loop;
                case "cool_on":
                    send({cool: 'on'}, machine.program[machine.pc], machine);
                    machine.timeout = setTimeout(run.bind(null,  send, machine), machine.program[machine.pc++] * 1000);
                    break loop;
                case "cool_off":
                    send({cool: 'off'}, machine.program[machine.pc], machine);
                    machine.timeout = setTimeout(run.bind(null,  send, machine), machine.program[machine.pc++] * 1000);
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
                    machine.pc = 0;
                    machine.def.resolve();
            }
        }
    }

    function simulate(machine) {
        var simulation = [];
        machine.duration = 0;
        finished = false;
        while(!finished){
            switch (machine.program[machine.pc++]) {
                case "on":
                    simulation.push('on');
                    machine.duration += machine.program[machine.pc];
                    simulation.push(machine.program[machine.pc++] * 1000);
                    break;
                case "off":
                    simulation.push('off');
                    machine.duration += machine.program[machine.pc];
                    simulation.push(machine.program[machine.pc++] * 1000);
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
                    finished = true;
            }
        }
        return machine;
    }

    function start() {
        machine.def = $.Deferred();
        machine.def
        .then(function(){
            output.html('finished');
        });
        run(send, machine)
    }

    function pause() {
        clearTimeout(machine.timeout);
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
        parse();
    }

    function getFloat(input) {
        var float = parseFloat(input);
        if (Number.isNaN(float)) {
            throw 'error, bad number';
        }
        return float;
    }

    function formatDuration(seconds){
        var hours = parseInt( seconds / 3600, 10);
        var minutes = parseInt( seconds / 60, 10) % 60;
        return hours + ' hours ' + minutes + ' minutes ' + (seconds%60).toFixed(1) + ' seconds';
    }


    function parse() {
        machine = new Machine();
        var status = [];
        var funcs = [];
        var lines = textarea.val().split(/\r*\n/);
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
                        machine.temp_tween(getFloat(tokens[1]), getFloat(tokens[2]),  getFloat(tokens[3]));
                    	break;
                    case 'letter':
                        var letter = tokens[1].toUpperCase();
                        if(!alphabet[letter]){
                            throw 'unknown letter';
                        }
                        (alphabet[letter].low || alphabet[letter].high)(machine);
                        break;
                    case 'word':
                        var position = 'low'
                        tokens[1].toUpperCase().split('').map(function(letter){
                            if(!alphabet[letter]){
                                throw 'unknown letter';
                            }
                            if(!alphabet[letter][position]){
                                throw 'unknown letter position';
                            }
                            alphabet[letter][position](machine);
                        });
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
        console.log(machine.program);
        output.html(status.join('<br/>'));
        if(!errored){
            var duration = formatDuration(simulate(machine.clone()).duration);
            console.log('Total duration: ', duration);
            output.append(duration);
        }

    }



    $('<div/>')
        .attr({
            'class': 'status'
        })
        .appendTo('#main')
        .append($('<div/>').addClass('heat').text('Heat: unknown'))
        .append($('<div/>').addClass('cool').text('Cool: unknown'))
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
        .on('click', update.bind(null, {heat: 'on'}))
        .appendTo('#buttons');

    $('<input/>')
        .attr({
            type: 'button',
            value: 'off',
            class: 'btn'
        })
        .on('click', update.bind(null, {heat: 'off'}))
        .appendTo('#buttons');


    var button_bar = $('<div/>')
        .addClass('buttons')
        .css({
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
        .on('keyup', inputUpdate)
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
