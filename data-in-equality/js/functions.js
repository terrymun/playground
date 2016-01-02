$(function() {

	// Globals
	var $w = $(window),
		$d = $(document);

	function ColorLuminance(hex, lum) {

		// validate hex string
		hex = String(hex).replace(/[^0-9a-f]/gi, '');
		if (hex.length < 6) {
			hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
		}
		lum = lum || 0;

		// convert to decimal and change luminosity
		var rgb = "#", c, i;
		for (i = 0; i < 3; i++) {
			c = parseInt(hex.substr(i*2,2), 16);
			c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
			rgb += ("00"+c).substr(c.length);
		}

		return rgb;
	}

	// Map Globals
	// Dimensions
	var mapWidth = 960,
		mapHeight = 600;

	var mapFill,
		mapZ;

	var date = '01-1970',
		decade = 1970,
		sort = null;

	var projection = d3.geo.albersUsa()
		.scale(1285)
		.translate([mapWidth / 2, mapHeight / 2]);

	var path = d3.geo.path()
		.projection(projection);

	var svg = d3.select('#map-wrapper').append('svg')
		.attr({
			'viewBox': '0 0 '+mapWidth+' '+mapHeight,
			'id': 'map-usa'
		})
		.style('display', 'none');

	var defs = svg.append("defs");

	// Data variables
	var attributeArray = [],
		colors0 = {},
		colors = {
			'NoCUCs': {
				fill: '#b30000',
				color: '#eee',
				legend: 'Civil unions illegal in constituion',
				desc: 'Civil unions are illegal in constituion.'
			},
			'NoCUSt': {
				fill: '#d7301f',
				color: '#eee',
				legend: 'Civil unions illegal by statute',
				desc: 'Civil unions are illegal by statute.'
			},
			'NoMrCs': {
				fill: '#e08214',
				color: '#333',
				legend: 'Same-sex marriages illegal in constitution',
				desc: 'Same-sex marriages are illegal in constitution.'
			},
			'NoMrSt': {
				fill: '#fdb863',
				color: '#333',
				legend: 'Same-sex marriages illegal by statute',
				desc: 'Same-sex marriages are illegal by statute.'
			},
			'NA': {
				fill: '#ddd',
				color: '#333',
				legend: 'None/unclear',
				desc: 'There are no laws or unclear/ambiguous ones governing same-sex marriages and/or civil unions.'
			},
			'SomeCUSt': {
				fill: '#c7e9b4',
				color: '#333',
				legend: 'Civil unions with some rights legal',
				desc: 'Civil unions are permitted, but only with some rights legal (varies state-by-state).'
			},
			'YesCUSt': {
				fill: '#7fcdbb',
				color: '#333',
				legend: 'Civil unions permitted by statute',
				desc: 'Civil unions are permitted by statute.'
			},
			'YesCUCs': {
				fill: '#41b6c4',
				color: '#333',
				legend: 'Civil unions permitted in constitution',
				desc: 'Civil unions are permitted in constitution.'
			},
			'YesMrSt': {
				fill: '#1d91c0',
				color: '#eee',
				legend: 'Same-sex marraiges permitted through legislative or voter action',
				desc: 'Same-sex marriages are permitted through legislative or voter action.'
			},
			'YesMrCs': {
				fill: '#225ea8',
				color: '#eee',
				legend: 'Same-sex marraiges permitted through judicial action',
				desc: 'Same-sex marriages are permitted through judicial action.'
			}
		};

	// Date slider
	var dateAnimation = null,
		dateIndex,
		dates = ['01-1970','01-1973','01-1975','03-1975','01-1979','01-1995','01-1996','11-1996','02-1997','04-1997','07-1997','01-1998','02-1998','04-1998','05-1998','11-1998','01-1999','07-1999','09-1999','01-2000','07-2000','11-2000','07-2001','01-2002','11-2002','09-2003','11-2003','01-2004','02-2004','06-2004','09-2004','10-2004','11-2004','01-2005','04-2005','05-2005','06-2005','11-2005','06-2006','07-2006','11-2006','02-2007','07-2007','01-2008','02-2008','06-2008','10-2008','11-2008','04-2009','05-2009','07-2009','09-2009','10-2009','11-2009','12-2009','01-2010','03-2010','06-2011','07-2011','01-2012','05-2012','12-2012','01-2013','05-2013','06-2013','07-2013','08-2013','10-2013','12-2013','01-2014','05-2014','06-2014','10-2014','11-2014','01-2015','02-2015','03-2015','06-2015'],
		updateRangeValue = function() {
			$('#range-value').text(d3.time.format('%b %Y')(d3.time.format('%m-%Y').parse(date)));
		},
		updateAnimationButton = function(txt) {
			$('#date-animate').text(txt);
		},
		animateDate = function() {
			dateAnimation = window.setInterval(function() {
				dateIndex = dates.indexOf(date);

				// Perform animation
				if(dateIndex < dates.length - 1) {
					dateIndex++;
					$('#date-slider-input').val(dateIndex).trigger('change');
				} else {
					$('#date-animate').attr('data-animation-state', 'stopped');
					updateAnimationButton('Restart');
					window.clearInterval(dateAnimation);
				}
				
			}, 750);
		};

	// Global variables
	var statusPop = [
			{ 'status': 'NoCUCs', 'pop': 0, 'MrSort': 6 },
			{ 'status': 'NoCUSt', 'pop': 0, 'MrSort': 7 },
			{ 'status': 'NoMrCs', 'pop': 0, 'MrSort': 1 },
			{ 'status': 'NoMrSt', 'pop': 0, 'MrSort': 2 },
			{ 'status': 'NA', 'pop': 0, 'MrSort': 3 },
			{ 'status': 'SomeCUSt', 'pop': 0, 'MrSort': 8 },
			{ 'status': 'YesCUSt', 'pop': 0, 'MrSort': 9 },
			{ 'status': 'YesCUCs', 'pop': 0, 'MrSort': 10 },
			{ 'status': 'YesMrSt', 'pop': 0, 'MrSort': 4 },
			{ 'status': 'YesMrCs', 'pop': 0, 'MrSort': 5 }
		],
		statesPop = [],
		statuses = [],
		popPie = {},
		popDots = {};

	// Push statuses
	for (var i in statusPop) {
		statuses.push(statusPop[i].status);
	}

	// When data is ready
	var dataReady = function(error, us, usData, eventData) {
		if (error) throw error;

		// Functions
		var fun = {
			iconStatus: function(status) {
				var iconStatus;
				switch (status) {
					case 'NoMrSt':
						iconStatus = 'no';
						break;
					case 'NoMrCs':
						iconStatus = 'no';
						break;
					case 'NoCUSt':
						iconStatus = 'no';
						break;
					case 'NoCUCs':
						iconStatus = 'no';
						break;	
					case 'YesMrSt':
						iconStatus = 'ys';
						break;
					case 'YesMrCs':
						iconStatus = 'ys';
						break;							
					case 'YesCUSt':
						iconStatus = 'cu';
						break;
					case 'YesCUCs':
						iconStatus = 'cu';
						break;
					case 'SomeCUSt':
						iconStatus = 'cu';
						break;
					case 'NA':
						iconStatus = 'na';
						break;
					default:
						iconStatus = 'na';
						break;
				}
				return iconStatus;
			},
			midAngle: function(d) {
				return d.startAngle + (d.endAngle - d.startAngle)/2;
			},
			computeFill: function(d) {
				var status = 'NA';
				for (var j in eventData[d.id]) {
					if(d3.time.format('%m-%Y').parse(date) >= d3.time.format('%m-%Y').parse(eventData[d.id][j].date)) {
						status = eventData[d.id][j].status;
					}
				}

				// Push cumulative pop
				// Round year to lower decade
				var year = d3.time.format('%Y')(d3.time.format('%m-%Y').parse(date));
				decade = Math.floor(year/10)*10;
				for (var j in statusPop) {
					if(statusPop[j].status === status) {
						statusPop[j].pop += d.properties['pop'+decade];
						statesPop.push({
							'stateCode': d.properties.stateCode,
							'state': d.properties.stateName,
							'pop': d.properties['pop'+decade],
							'income': d.properties['income'+year],
							'status': status,
							'jitter': 0
						});
					}
				}

				// Return color
				return colors[status].fill;
			},
			updateFill: function() {
				d3.select('#map-usa').selectAll('.states')
					.transition()
					.duration(500)
					.attr('fill', function(d) {
						return fun.computeFill(d);
					});
			},
			mergeData: function(first, second) {
				var secondSet = d3.set(); second.forEach(function(d) { secondSet.add(d.label); });

				var onlyFirst = first.filter(function(d) {
					return !secondSet.has(d.status);
				})
				.map(function(d) {
					return { status: d.status, pop: 0 };
				});
				return d3.merge([second, onlyFirst]);
			},
			drawPie: function(sort) {
				var data = statusPop;

				// Define pie
				popPie.pie = d3.layout.pie().value(function(d) { return d.pop; }).sort(function(a,b) {
					if(sort === null || sort === undefined) {
						return null;
					} else {
						return d3.ascending(a[sort], b[sort]);
					}
				});

				// Data states
				var data0 = popPie.svg.select('.slices').selectAll('path.slice').data().map(function(d) { return d.data; });
				if(data0.length === 0) data0 = data;

				var previousData	= fun.mergeData(data, data0);
				var currentData		= fun.mergeData(data0, data);

				// Draw slices
				popPie.slice = popPie.svg.select('.slices').selectAll('path.slice').data(popPie.pie(previousData));

				popPie.slice.enter()
					.insert('path')
					.attr({
						'class': 'slice',
						'fill': '#eee',
						'stroke': '#fff',
						'stroke-width': 2,
						'd': function(d) {
							return popPie.arc(d);
						}
					}).each(function(d) { return this._current = d; })
					.call(d3.helper.tooltip(function(d,i) {
						var iconStatus = fun.iconStatus(d.data.status),
							out = '';

						out += '<ul>';
						out += '<li style="color: '+ColorLuminance(colors['YesMrCs'].fill, -0.25)+';" class="diff-sex ys"><span class="icon-male"></span><span class="icon-female"></span><span class="icon-ys"></span></li>';
						out += '<li style="color: '+ColorLuminance(colors[d.data.status].fill, -0.25)+';" class="same-sex '+iconStatus+'"><span class="icon-female"></span><span class="icon-female"></span><span class="icon-'+iconStatus+'"></span></li>';
						out += '<li style="color: '+ColorLuminance(colors[d.data.status].fill, -0.25)+';" class="same-sex '+iconStatus+'"><span class="icon-male"></span><span class="icon-male"></span><span class="icon-'+iconStatus+'"></span></li>';
						out += '</ul>';

						return '<article class="pie-tooltip"><header style="background-color: '+ColorLuminance(colors[d.data.status].fill, -0.5)+';"><h1>'+d3.format(',0f')(d.data.pop)+'</h1><span>(<strong>'+d3.format('.1%')((d.endAngle-d.startAngle)/(2*Math.PI))+'</strong> of population based on the '+decade+' census)</span></header><section>'+out+'<p>The number of people living in state(s) where '+colors[d.data.status].desc.toLowerCase()+'</p></section></article>';
					}));

				popPie.slice = popPie.svg.select('.slices').selectAll('path.slice').data(popPie.pie(currentData));

				popPie.slice.transition().duration(500)
					.attrTween('d', function(d) {
						var interpolate = d3.interpolate(this._current, d);
						var _this = this;
						return function(t) {
							_this._current = interpolate(t);
							return popPie.arc(_this._current);
						};
					})
					.attr('fill', function(d) { return colors[d.data.status].fill; })
					.style({
						'opacity': function(d) { return (d.data.pop > 0 ? 1 : 0); },
						'pointer-events': function(d) { return (d.data.pop > 0 ? 'auto' : 'none'); }
					});

				popPie.slice = popPie.svg.select('.slices').selectAll('path.slice').data(popPie.pie(data));

				popPie.slice.exit().transition().delay(500).duration(0).remove();

				// Add percentage votes
				popPie.labelText = popPie.svg.select('.labels').selectAll('text.percent').data(popPie.pie(previousData));

				popPie.labelText.enter()
					.insert('text')
					.attr({
						'class': 'percent',
						'fill': '#fff',
						'text-anchor': 'middle',
						'dy': '.35em'
					})
					.style('opacity', 0)
					.each(function(d) { this._current = d; });

				popPie.labelText = popPie.svg.select('.labels').selectAll('text.percent').data(popPie.pie(currentData));

				popPie.labelText.transition().duration(500)
					.style('opacity', function(d) { return d.endAngle - d.startAngle < 0.05 * Math.PI ? 0 : 1; })
					.attr('font-size', 24)
					.attrTween('transform', function(d) {
						var interpolate = d3.interpolate(this._current, d);
						var _this = this;
						return function(t) {
							_this._current = interpolate(t);
							var pos = popPie.labelArc.centroid(_this._current),
								textRotate = function(d) {
									return fun.midAngle(d)/Math.PI*180 + (fun.midAngle(d) < Math.PI ? -1 : 1) * 90;
								}
							return 'translate('+pos+') rotate('+textRotate(_this._current)+')';
						}
					})
					.tween('text', function(d) {
						var interpolate = d3.interpolate(this._current, d);
						var _this = this;
						return function(t) {
							_this._current = interpolate(t);
							this.textContent = d3.format('.1%')((_this._current.endAngle-_this._current.startAngle)/(2*Math.PI));
						};
					});

				popPie.labelText = popPie.svg.select('.labels').selectAll('text.percent').data(popPie.pie(data));

				popPie.labelText.exit().transition().delay(500).duration(0).remove();

			},
			getRandomInt: function(min, max) {
				return Math.floor(Math.random() * (max - min + 1)) + min;
			},
			setPopDots: function() {
				if($(window).width() >= 500) {
					popDots.width = $('#map-dot').width() - popDots.margin.left - popDots.margin.right;
					popDots.height = 300 - popDots.margin.top - popDots.margin.bottom;
					fun.fisheye('on');
				} else {
					popDots.width = 400 - popDots.margin.left - popDots.margin.right;
					popDots.height = 250 - popDots.margin.top - popDots.margin.bottom;
					fun.fisheye('off');
				}
			},
			drawDots: function() {
				popDots.popExtent = [-2500000, Math.ceil(d3.max(statesPop.map(function(i) { return i.pop; }))/5000000)*5000000];
				popDots.incExtent = [d3.min(statesPop.map(function(i) { return i.income; })), d3.max(statesPop.map(function(i) { return i.income; }))];
				popDots.yScale.domain(popDots.popExtent).range([popDots.height, 0]);
				popDots.zScale.domain(popDots.incExtent).range([3,15]);
				popDots.yAxis.tickValues(fun.setTickValues());

				popDots.svg.select('.x.axis').transition().duration(500).call(popDots.xAxis.orient('bottom')).attr('transform', 'translate(0,'+popDots.height+')');
				popDots.svg.select('.y.axis').transition().duration(500).call(popDots.yAxis.orient('left'));

				popDots.svg.select('.x.axis .label').transition().duration(500).attr('x', popDots.width);

				popDots.svg.selectAll('.x.axis .tick text').style({'text-anchor': 'end'});
				popDots.svg.selectAll('.x.axis .tick text')
					.transition().duration(500)
					.style({
						'fill': function(d) { return ColorLuminance(colors[d].fill, -0.25); }
					});

				popDots.svg.selectAll('.dots')
					.data(statesPop)
					.transition().duration(500)
						.attr({
							'r': function(d) { return (d.income ? popDots.zScale(d.income) : 5); },
							'cx': function(d,i) { return popDots.xScale(d.status) + 0.5*popDots.xScale.rangeBand() + popDots.jitter[i]*popDots.xScale.rangeBand()*0.25; },
							'cy': function(d) { return popDots.yScale(d.pop); }
						})
						.style({
							'fill': function(d) { return colors[d.status].fill; }
						});
			},
			setTickValues: function() {
				var upperBound = Math.ceil(d3.max(statesPop.map(function(i) { return i.pop; }))/5000000),
					tickValues = [];
				for (var i = 0; i < upperBound + 1; i++) {
					tickValues.push(i*5000000);
				}
				return tickValues;
			},
			fisheye: function(status) {
				if(status === 'on') {
					d3.select('#map-dot')
					.on('mouseenter', function() {
						popDots.yScale = d3.fisheye.scale(d3.scale.linear).domain(popDots.popExtent).range([popDots.height, 0]);
						popDots.yAxis.scale(popDots.yScale);
						popDots.svg.select('.y.axis').transition().duration(100).call(popDots.yAxis);
					})
					.on('mousemove', function() {
						var mouse = d3.mouse(this);
						popDots.yScale.distortion(5).focus(mouse[1]);
						popDots.svg.select('.y.axis').call(popDots.yAxis);
						popDots.svg.selectAll('circle.dots').attr('cy', function(d) { return popDots.yScale(d.pop); });
					});
				} else {
					d3.select('#map-dot')
						.on('mouseenter', null)
						.on('mousemove', null);
				}				
			}
		};

		// Merge data into topojson
		var states = us.objects.states.geometries;

		for (var i in states) {
			states[i].properties = {};
			for (var j in usData) {
				if(states[i].id == usData[j].stateID) {
					for (var k in usData[i]) {
						if(k !== 'stateID') {
							if(attributeArray.indexOf(k) === -1) {
								attributeArray.push(k);
							}
							states[i].properties[k] = (['stateName','stateCode'].indexOf(k) > -1 ? usData[j][k] : +usData[j][k]);
						}
					}
					break;
				}
			}
		}

		// Map data
		var mapData = {
			states: topojson.feature(us, us.objects.states).features
		};

		// Draw map
		defs.append('path')
			.datum(topojson.feature(us, us.objects.land))
			.attr('id', 'land')
			.attr('d', path);

		svg.append('use')
			.attr('class', 'land-fill')
			.attr('xlink:href', '#land');

		svg.selectAll('.states')
			.data(mapData.states.filter(function(d) { return +d.id !== 72 && +d.id !== 78; }))
			.enter()
			.append('path')
				.attr({
					'class': 'states',
					'd': path,
					'id': function(d) {
						return d.id;
					},
					'fill': function(d) {
						return fun.computeFill(d);
					}
				})
				.call(d3.helper.tooltip(
					function(d, i) {
						var eventDate,
							eventDesc,
							eventStatus = 'NA',
							currentStatus = 'NA',
							currentStatusDesc = colors[eventStatus].desc,
							eventList = '',
							eventCount = 0;

						eventList += '<ol>';
						for (var j in eventData[d.id]) {
							var _e = eventData[d.id][j];

							eventDate = _e.date;
							eventDesc = _e.event;
							eventStatus = _e.status;

							if(d3.time.format('%m-%Y').parse(date) >= d3.time.format('%m-%Y').parse(eventDate)) {
								eventCount++;
								eventList += '<li><span class="timeline-dot" style="background-color: '+colors[eventStatus].fill+';"></span><span class="event-date" style="background-color: '+colors[eventStatus].fill+'; color: '+colors[eventStatus].color+';">'+d3.time.format('%b %Y')(d3.time.format('%m-%Y').parse(eventDate))+'</span> <span>'+eventDesc+'</span></li>';
								currentStatusDesc = colors[eventStatus].desc;
								currentStatus = eventStatus;
							}
						}
						eventList += '</ol>';

						var iconStatus = fun.iconStatus(currentStatus),
							out = '';

						out = '<article class="map-tooltip"><header style="background-color: '+ColorLuminance(colors[currentStatus].fill, -0.5)+';"><h1>'+d.properties.stateName+'</h1></header><section>';
						out += '<ul>';
						out += '<li style="color: '+ColorLuminance(colors['YesMrCs'].fill, -0.25)+';" class="diff-sex ys"><span class="icon-male"></span><span class="icon-female"></span><span class="icon-ys"></span></li>';
						out += '<li style="color: '+ColorLuminance(colors[currentStatus].fill, -0.25)+';" class="same-sex '+iconStatus+'"><span class="icon-female"></span><span class="icon-female"></span><span class="icon-'+iconStatus+'"></span></li>';
						out += '<li style="color: '+ColorLuminance(colors[currentStatus].fill, -0.25)+';" class="same-sex '+iconStatus+'"><span class="icon-male"></span><span class="icon-male"></span><span class="icon-'+iconStatus+'"></span></li>';
						out += '</ul>';
						out += '<p>Status as of <strong>'+d3.time.format('%B %Y')(d3.time.format('%m-%Y').parse(date))+'</strong>: '+currentStatusDesc+'</p>';
						out += (eventCount > 0 ? eventList : '');
						out += '</section></article>';

						return out;
					}
				));

		// Draw state boundaries
		svg.append('path')
			.datum(topojson.mesh(us, us.objects.states, function(a, b) {
				return a !== b; // a border between two states
			}))
			.attr({
				'class': 'state-boundary',
				'd': path
			});

		// Draw state names
		svg.selectAll('.state-name')
			.data(mapData.states.filter(function(d) { return +d.id !== 72 && +d.id !== 78; }))
			.enter()
			.append('text')
				.attr({
					'x': function(d) { return path.centroid(d)[0]; },
					'y': function(d) {
						var yPos = path.centroid(d)[1];
						if(d.id === 11) {
							yPos += 5;
						} else if(d.id === 24) {
							yPos -= 5;
						}
						return yPos;
					},
					'dy': '0.35em',
					'class': 'state-name',
					'text-anchor': 'middle',
					'font-size': 12
				})
				.style({
					'opacity': 0.5,
					'pointer-events': 'none'
				})
				.text(function(d) { return d.properties.stateCode; });

		// Draw legends
		for (var i in colors) {
			var $legend = $('<li class="'+i+'" style="border-left-color: '+colors[i].fill+';">'+colors[i].legend+'</li>');
			$legend.prependTo('#map-legend-list');
		}

		// Draw dot plot
		popDots.margin = {top: 30, right: 0, bottom: 85, left: 50};
		fun.setPopDots();

		popDots.xScale = d3.scale.ordinal().domain(statuses).rangeRoundBands([0, popDots.width], 0, 0.25);
		popDots.popExtent = [-2500000, Math.ceil(d3.max(statesPop.map(function(i) { return i.pop; }))/1000000)*1000000];
		popDots.yScale = d3.scale.linear().domain(popDots.popExtent).range([popDots.height, 0]);
		popDots.zScale = d3.scale.linear().domain([0,50000]).range([5,15]);

		popDots.xAxis = d3.svg.axis().scale(popDots.xScale).orient('bottom').outerTickSize(0);
		popDots.yAxis = d3.svg.axis().scale(popDots.yScale).orient('left').outerTickSize(0).innerTickSize(-popDots.width).tickFormat(function(d) {
			return d3.format('s')(d).replace('M',' mil');
		}).tickValues(fun.setTickValues());

		// Generate global jitter
		popDots.jitter = [];
		for (var i = 0; i < 100; i++) {
			popDots.jitter.push(fun.getRandomInt(-10,10)/10);
		}

		popDots.svg = d3.select('#map-dot').append('svg')
			.attr('viewBox', '0 0 '+(popDots.width+popDots.margin.left+popDots.margin.right)+' '+(popDots.height+popDots.margin.top+popDots.margin.bottom))
			.append('g')
				.attr('transform', 'translate('+popDots.margin.left+','+popDots.margin.top+')');

		popDots.svg.append('g')
			.attr({
				'class': 'x axis',
				'transform': 'translate(0,'+popDots.height+')'
			})
			.style('font-size', '12')
			.call(popDots.xAxis)
			.append('text')
				.attr({
					'class': 'label',
					'x': popDots.width,
					'y': 80,
					'text-anchor': 'end'
				})
				.style('font-weight', 'bold')
				.text('Legal status of same-sex unions'.toUpperCase());

		popDots.svg.selectAll('.x.axis .tick text')
			.attr({
				'transform': 'rotate(-45) translate(-5,0)'
			})
			.style({
				'cursor': 'pointer',
				'fill': function(d) { return ColorLuminance(colors[d].fill, -0.25); },
				'opacity': 1,
				'text-anchor': 'end',
				'font-weight': 'bold'
			})
			.call(d3.helper.tooltip(function(d) {
				return '<article class="dots-axis-tooltip"><header style="background-color: '+ColorLuminance(colors[d].fill, -0.5)+';"><h1>'+colors[d].legend+'</h1></header></article>';
			}));

		popDots.svg.append('g')
			.attr({
				'class': 'y axis'
			})
			.style('font-size', '12')
			.call(popDots.yAxis)
				.append('text')
				.attr({
					'transform': 'rotate(-90)',
					'y': 6,
					'dy': '.71em',
					'text-anchor': 'end'
				})
				.style('font-weight', 'bold')
				.text('Population'.toUpperCase());

		popDots.svg.selectAll('.dots')
			.data(statesPop)
			.enter()
				.append('circle')
				.attr({
					'class': 'dots',
					'r': function(d) { return (d.income ? popDots.zScale(d.income) : 5); },
					'cx': function(d,i) { return popDots.xScale(d.status) + 0.5*popDots.xScale.rangeBand() + popDots.jitter[i]*popDots.xScale.rangeBand()*0.25; },
					'cy': function(d) { return popDots.yScale(d.pop); }
				})
				.style({
					'fill': function(d) { return colors[d.status].fill; }
				})
				.call(d3.helper.tooltip(function(d) {
					return '<article class="dots-tooltip"><header style="background-color: '+ColorLuminance(colors[d.status].fill, -0.5)+';"><h1>'+d.state+'</h1><span>Population by '+decade+' census: <strong>'+d3.format(',')(d.pop)+'</strong></span></header><section><p>Status as of <strong>'+d3.time.format('%B %Y')(d3.time.format('%m-%Y').parse(date))+'</strong>: '+colors[d.status].desc+'</section></article>';
				}))

		// Bind window resize
		$(window).resize($.throttle(250, function() {
			fun.setPopDots();
			popDots.xScale.rangeRoundBands([0, popDots.width], 0, 0.25);
			popDots.yScale.range([popDots.height, 0]);
			popDots.yAxis.innerTickSize(-popDots.width);
			d3.select('#map-dot-move').attr({
				'width': popDots.width + popDots.margin.left,
				'height': popDots.height + popDots.margin.top
			});
			d3.select('#map-dot').select('svg').attr('viewBox', '0 0 '+(popDots.width+popDots.margin.left+popDots.margin.right)+' '+(popDots.height+popDots.margin.top+popDots.margin.bottom));
			fun.drawDots();
		}));

		fun.fisheye($(window).width() < 500 ? 'off' : 'on');
		d3.select('#map-dot')
		.on('mouseleave', function() {
			popDots.yScale = d3.scale.linear().domain(popDots.popExtent).range([popDots.height, 0]);
			popDots.yAxis.scale(popDots.yScale);
			popDots.svg.select('.y.axis').transition().duration(100).call(popDots.yAxis);
			popDots.svg.selectAll('circle.dots').transition().duration(100).attr('cy', function(d) { return popDots.yScale(d.pop); });
		});

		$('#map-dot').append('<span class="legend-title align-center">Classification of US states by stance on same-sex union.<br />Size of dots, when variable, represent the state\'s yearly median income.</span>')

		// Draw pie chart
		// Pie properties
		popPie.labelSize = 30;
		popPie.radius = Math.min(500,500) / 2;
		popPie.arc = d3.svg.arc().outerRadius(popPie.radius).innerRadius(popPie.radius * 0);
		popPie.labelArc = d3.svg.arc().outerRadius(popPie.radius * 0.5).innerRadius(popPie.radius * 0.5);

		popPie.svg = d3.select('#map-pop').append('svg')
			.attr('viewBox', '0 0 500 500')
			.append('g')
			.attr('transform', 'translate(250, 250)');

		$('#map-pop').append('<span class="legend-title align-center">US population living in states with varying legalities on same-sex unions.</span>')

		popPie.svg.append('g').attr('class', 'slices');
		popPie.svg.append('g').attr('class', 'labels');
		fun.drawPie(sort);

		// Hide loader and enable controls
		$('#map-loader').fadeOut(1000);
		$('#map-usa').fadeIn(1000);
		$('#map-controls :input').prop('disabled', false);

		updateRangeValue();
		updateAnimationButton('Play');

		$('#date-animate').on('click', function() {
			
			var $t = $(this),
				s = $t.attr('data-animation-state');

			// Switch states
			if(!s || s === 'stopped' || s === 'paused') {
				$t.attr('data-animation-state', 'playing');
				updateAnimationButton('Pause');
				if(s==='stopped') {
					$('#date-slider-input').val(0).trigger('change');
				}
				animateDate();
			} else {
				$t.attr('data-animation-state', 'paused');
				updateAnimationButton('Resume');
				window.clearInterval(dateAnimation);
			}
		});

		$('#date-slider-input')
		.attr({
			'min': 0,
			'max': dates.length - 1
		})
		.on('input change', function() {

			var idx = parseInt($(this).val());
			
			date = dates[idx];

			// Reset population counts
			for (var i in statusPop) {
				statusPop[i].pop = 0;
			};
			statesPop = [];

			// Update map fills
			fun.updateFill();

			// Update range value
			updateRangeValue();

			// Update pie
			fun.drawPie(sort);

			// Update dot plot
			fun.drawDots();

			// Update background gradient
			$(this).css('background-position', '-'+(idx/dates.length)*100-100+'% 50%');
		});

		// Toggle marriage only
		$('#marriage-only').on('change', function() {
			if($(this).prop('checked')) {
				sort = 'MrSort';
				// Hide civil union legends
				$('#map-legend-list > li').each(function() {
					if($(this).attr('class').indexOf('CU') > -1) $(this).slideUp(500);
				});

				// Update fills and cache original colors
				for (var i in colors) {
					if(i.indexOf('CU') > -1) {
						colors0[i] = {};
						colors0[i].fill = colors[i].fill;
						colors[i].fill = '#ddd';
					}
				}
				fun.updateFill();
			} else {
				sort = null;
				// Show civil union legends
				$('#map-legend-list > li').each(function() {
					if($(this).attr('class').indexOf('CU') > -1) $(this).slideDown(500);
				});

				// Restore original colors
				for (var i in colors) {
					if(i.indexOf('CU') > -1) {
						colors[i].fill = colors0[i].fill;
					}
				}
				fun.updateFill();
			}
			fun.drawPie(sort);
			fun.drawDots();
		});
	};

	queue()
		.defer(d3.json, './data/usa.json')
		.defer(d3.csv, './data/state-data.csv')
		.defer(d3.json, './data/state-events.json')
		.await(dataReady);

});