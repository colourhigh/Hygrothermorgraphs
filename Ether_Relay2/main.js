
$(document).ready(function(){

	var coil_state;
	var interval;
	var phase_on;
	var phase_off;

	var update = function(state){
		var xhr;
		if(state !== undefined){
			xhr = $.get('/ajax?output='+(state ? 'on': 'off'));
		}
		else{
			xhr = $.get('/ajax');
		}
		xhr.done(function(data){
			coil_state = data.state === 'on';
			$('.status .state').text('State: '+data.state);
			$('.status .temperature').text('Temperature: '+data.temperature);
			$('.status').css({'color': coil_state ? 'green': 'red'});
		})
	};

	
	var alternater = function(on, off){
		phase_on = on;
		phase_off = off;
		clearTimeout(interval);
		interval = setTimeout(function(){
			if(on > 0 && off > 0){
				update(!coil_state);
				alternater(phase_on, phase_off);
			}
		},  (coil_state ? phase_off: phase_on)*1000);
	};

	$('<div/>')
		.attr({
			'class': 'status'
		})
		.appendTo('#main')
		.append($('<div/>').addClass('state').text('State: unknown'))
		.append($('<div/>').addClass('temperature').text('Temperature: unknown'))
		.css({'font-size': '30px',
				'font-family': 'monospace',
				'text-align': 'center'});

	$('<div/>')
		.attr({id: 'buttons'})
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

	$('<div/>')
		.text('On phase: ')
		.append(
		$('<input/>')
			.attr({
				type: 'number',
				value: '0',
				min: 0,
				max: 1000,
				class: 'btn',
				id: "phase_on"
			})
			.on('change', function(){
				alternater(this.value|0, $('#phase_off').val()|0);
			})			
		)
		.appendTo('#buttons');

	$('<div/>')
		.text('Off phase: ')
		.append(
		$('<input/>')
			.attr({
				type: 'number',
				value: '0',
				min: 0,
				max: 1000,
				class: 'btn',
				id: 'phase_off'
			})
			.on('change', function(){
				alternater($('#phase_on').val()|0, this.value|0);
			})			
		)
		.appendTo('#buttons');


	phase_on = $('#phase_on').val()|0;
	phase_off = $('#phase_off').val()|0;	
	update();
});
