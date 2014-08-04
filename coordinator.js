$(document).on('ready', function(){
"use strict";

	var days = 40;

	function generateBlock(date, count){
		var template = $('<div data-date="'+date.toLocaleDateString()+'" class="entry"><span class="date">'+date.toLocaleDateString()+'</span><table><tr></tr><tr></tr></table></div>');

		for(var i =0;i <count; i++){
			template.find('table tr:first').append('<th>Sculpture '+(i+1)+'</td>');
			template.find('table tr:last').append('<td><textarea></textarea></td>');
		}
		return template;
	}


	for(var i=0;i<days;i++){
		var date = new Date();
		date.setDate(date.getDate()+i)
		$('#main').append(generateBlock(date, 3))

	}

	$('#save').on('click', function(){

		var data = $('.entry').map(function(){
			var $this= $(this);

			return {
				date: $(this).attr('data-date'),
				values: $this.find('textarea').map(function(){
					return $(this).val();
				}).toArray()
			}
		}).toArray();
		$.post('/schedule', {data: JSON.stringify(data)});
	});

	$.get('/schedule')
		.then(function(data){
			data.forEach(function(d){
				var div = $('div[data-date="'+d.date+'"]');
				d.values.forEach(function(v, i){
					div.find('textarea').eq(i).val(v);
				});
			});
		});
});