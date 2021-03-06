d3.helper = {};

d3.helper.tooltip = function(accessor){
	return function(selection){
		var tooltipDiv;
		var bodyNode = d3.select('body').node();
		selection.on("mouseover", function(d, i){
			// Clean up lost tooltips
			d3.select('body').selectAll('div.tooltip').remove();
			// Append tooltip
			tooltipDiv = d3.select('body').append('div').attr('class', 'tooltip');
			var absoluteMousePos = d3.mouse(bodyNode);
			tooltipDiv
				.style('top', (absoluteMousePos[1] - 15)+'px')
				.style('position', 'absolute') 
				.style('z-index', 1001);

			if(absoluteMousePos[0] > window.innerWidth*0.5) {
				tooltipDiv
				.style('left', (absoluteMousePos[0] - ($('.tooltip').outerWidth() + 10))+'px');
				
			} else {
				tooltipDiv
				.style('left', (absoluteMousePos[0] + 10)+'px');
			}

			// Add text using the accessor function
			var tooltipText = accessor(d, i) || '';
			tooltipDiv.html(tooltipText);
			// Crop text arbitrarily
			//tooltipDiv.style('width', function(d, i){return (tooltipText.length > 80) ? '300px' : null;})
			//	.html(tooltipText);
		})
		.on('mousemove', function(d, i) {
			// Move tooltip
			var absoluteMousePos = d3.mouse(bodyNode);
			tooltipDiv
				.style('top', (absoluteMousePos[1] - 15)+'px');

			if(absoluteMousePos[0] > window.innerWidth*0.5) {
				tooltipDiv
				.style('left', (absoluteMousePos[0] - ($('.tooltip').outerWidth() + 10))+'px');
				
			} else {
				tooltipDiv
				.style('left', (absoluteMousePos[0] + 10)+'px');
			}
		})
		.on("mouseout", function(d, i){
			// Remove tooltip
			tooltipDiv.remove();
		});

	};
};