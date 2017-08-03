'use strict';

angular.module('pingpongApp')
	.directive('pingpongVis', [ '$window', function(window) {
		return {
			restrict: 'EA',
			terminal: true,
			link: function(scope, element, attrs) {
				// Set the dimensions and margins of the diagram
				var margin = {top: 20, right: 200, bottom: 30, left: 90},
					width = 1000 - margin.left - margin.right,
					height = 800 - margin.top - margin.bottom;

				// append the svg object to the body of the page
				// appends a 'group' element to 'svg'
				// moves the 'group' element to the top left margin
				var svg = d3.select(element[0])
					.append("svg")
					.attr("width", width)
					.attr("height", height)
					.append("g")
					.attr("transform", "translate("
						  + margin.left + "," + margin.top + ")");

				var i = 0,
					duration = 750,
					root;

				// declares a tree layout and assigns the size
				var treemap = d3.tree().size([height, width]);

				// watch for window resize
				angular.element(window).on('resize', function resize() {
					width = element.parent()[0].clientWidth - margin.left - margin.right;

					svg.attr("width", width);

					scope.render()
				});

				// watch for data changes and re-render
				scope.$watch('treedata', function(newVals, oldVals) {
					return scope.render(newVals);
				}, true);

				// define render function
				scope.render = function(treedata) {
					width = element.parent()[0].clientWidth - margin.left - margin.right;

					treemap = d3.tree().size([height, width]);

					if (!scope.treedata)
						return;
					
					  // Creates a curved (diagonal) path from parent to the child nodes
					  function diagonal(s, d) {
						var path;

						path = `M ${s.y} ${s.x}
								C ${(s.y + d.y) / 2} ${s.x},
								  ${(s.y + d.y) / 2} ${d.x},
								  ${d.y} ${d.x}`

						return path
					  }

					root = d3.hierarchy(scope.treedata)
					root.x0 = height / 2;
					root.y0 = 0;

					svg.selectAll('g.node').remove()

					update(root)

					function update(source) {
						// Assigns the x and y position for the nodes
						var treeData = treemap(root);

						// Compute the new tree layout.
						var nodes = treeData.descendants(),
							links = treeData.descendants().slice(1);

						// Normalize for fixed-depth.
						// nodes.forEach(function(d){ d.y = d.depth * 180});

						// ****************** Nodes section ***************************

						// Update the nodes...
						var node = svg.selectAll('g.node')
							.data(nodes, d => d.id || (d.id = ++i));

						// Enter any new modes at the parent's previous position.
						var nodeEnter = node.enter()
							.append('g')
							.attr('class', 'node')
							.attr("transform", d => "translate(" + source.y0 + "," + source.x0 + ")")
							.on('click', click);

						var pie = d3.pie()
							.value(function(d) { return d.count; })
							.sort(null);

						var colors = d3.scaleOrdinal(scope.pieInfo.colors).domain(scope.pieInfo.quantiles);
						
						var arc = d3.arc()
							.innerRadius(0)
							.outerRadius(20);

						var path = nodeEnter
							.selectAll('g')
							.data(d => pie(d.data.mycount))
							.enter()
							.append('path')
							.attr('d', arc)
							.attr('fill', d => colors(d.data.value))

						// Add labels for the nodes
						nodeEnter.append('text')
							.attr("dy", ".35em")
							.attr("x", d => d.children || d._children ? -22 : 22)
							.attr("text-anchor", d => d.children || d._children ? "end" : "start")
							.text(d => d.data.name);

						nodeEnter.append('text')
							.attr("dy", ".35em")
							.attr("text-anchor", "middle")
							.attr("fill", "white")
							.attr("font-weight", "bold")
							.text(d => d.data.mydata.length);


					  // UPDATE
					  var nodeUpdate = nodeEnter.merge(node);

					  // Transition to the proper position for the node
					  nodeUpdate.transition()
						.duration(duration)
						.attr("transform", function(d) { 
							return "translate(" + d.y + "," + d.x + ")";
						 });

					  // Update the node attributes and style
					  nodeUpdate.select('circle.node')
						.attr('r', 10)
						.style("fill", function(d) {
							return d._children ? "lightsteelblue" : "#fff";
						})
						.attr('cursor', 'pointer');


					  // Remove any exiting nodes
					  var nodeExit = node.exit().transition()
						  .duration(duration)
						  .attr("transform", function(d) {
							  return "translate(" + source.y + "," + source.x + ")";
						  })
						  .remove();

					  // On exit reduce the node circles size to 0
					  //nodeExit.select('circle.node')
					  //  .attr('r', 1e-6)
					  //.style('fill-opacity', 1e-6);

					  // On exit reduce the opacity of text labels
					  nodeExit.selectAll('text')
						.style('fill-opacity', 1e-6);




					  // ****************** links section ***************************

					  // Update the links...
					  var link = svg.selectAll('path.link')
						  .data(links, function(d) { return d.id; });

					  // Enter any new links at the parent's previous position.
					  var linkEnter = link.enter().insert('path', "g")
						  .attr("class", "link")
						  .attr('d', function(d){
							var o = {x: source.x0, y: source.y0}
							return diagonal(o, o)
						  });

					  // UPDATE
					  var linkUpdate = linkEnter.merge(link);

					  // Transition back to the parent element position
					  linkUpdate.transition()
						  .duration(duration)
						  .attr('d', d => diagonal(d, d.parent));

					  // Remove any exiting links
					  var linkExit = link.exit().transition()
						  .duration(duration)
						  .attr('d', function(d) {
							var o = {x: source.x, y: source.y}
							return diagonal(o, o)
						  })
						  .remove();

					  // Store the old positions for transition.
					  nodes.forEach(function(d){
						d.x0 = d.x;
						d.y0 = d.y;
					  });

					  // Toggle children on click.
					  function click(d) {
							// update table
	//						if (myids != d.data.myids) {
	//							myids = d.data.myids

	//							datatable.draw();
	//						}

							if (d.children) {
								d._children = d.children;
								d.children = null;
							} else {
								d.children = d._children;
								d._children = null;
							}
							update(d);

						}
					}
				};
        	}


		};
    }])


