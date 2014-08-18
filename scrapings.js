$(document).ready(function(){
	var container = $('<div/>').addClass('scrapings');
	var specs = {};
	$.get('/json/scrapings')
		.done(function(data){
			data.forEach(function(datum){
				specs[datum.name] = specs[datum.name] || {results: []};
				specs[datum.name].results.push(
					{
						date: new Date(datum.date),
						trigrams: datum.trigrams
					}
				);
			})
			var ul = $('<ul/>');
			container.append(ul);
			Object.keys(specs).forEach(function(k, i){
				ul.append($('<li>').append($('<a/>').attr('href', '#tab'+i).text(k)));
				var div = $('<div/>').attr('id', 'tab'+i);
				specs[k].results.forEach(function(r, i){
					div.append( $('<h3/>').text(r.date.toLocaleString()) );
					div.append((r||[]).trigrams.map(function(t){
						return $('<p/>').text(t);
					}))
				});
				container.append(div);

			});
			container.appendTo('body').tabs();
			console.log(specs)
		});

});