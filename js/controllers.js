'use strict';

//
angular.module('pingpongApp')
	.controller('mainCtrl', [ '$scope', function($scope) {

	$scope.colors = [
		[],										// 0 colors (invalid)
		[ "black" ],							// 1 color
		[ "black", "green" ],					// 2 colors
		[ "black", "orange", "green" ],			// 3 colors
		[ "black", "red", "orange", "green" ]	// 4 colors
	];

	$scope.updateTree = function() {
		if (!$scope.panel.selectedPie)
			return;

		console.log("updating tree")

		function pie_count(values, keys) {
			var counts = []

			for (let [index, key] of keys.entries()) {
				var count = values.filter(x => x === key).length;
				counts.push({ value: key, count: count, color: index });
			}

			return counts;
		}

		function make_tree(data, class_keys, value_key, value_levels, name = name) {
			var node = { 
				mydata: data, 
				mycount: pie_count(data.map(d => d[ value_key ]), value_levels),
				myids: data.map(x => x["GeneID"]),
				name: name };

			if (class_keys.length > 0) {
				var class_key = class_keys[0];
				var filter_keys = Array.from(new Set(data.map(x => x[ class_key ]))).sort();

				node.children = []
				for (let key of filter_keys) {
					var data_subset = data.filter(d => d[ class_key ] === key);
					var child_name = class_key + "=" + key

					node.children.push(make_tree(data_subset, class_keys.slice(1, class_keys.length), value_key, value_levels, child_name));
				}
			}

			return node;
		}

		function calculateQuantiles(colname, qcolname, num_quantiles) {
			// calculates quantiles for colname in data
			// stores the results in qcolname in data
			var data = $scope.data

			// get the values to process
			var vals = data.map(x => parseFloat(x[ colname ])).sort((a, b) => a - b)
			
			// create d3.scaleQuantile ranges (e.g. for quartiles: [ 0, 1, 2, 3 ])
			var qt_ranges = Array.from(Array(num_quantiles).keys())

			// get probabilities for quantiles (e.g. for quartiles: [ 0, 0.25, 0.5, 0.75 ])
			var qt_probs = qt_ranges.map(x => x / num_quantiles)

			// create names for quantiles indicating the range of values
			var qt_names = qt_probs.map(q => Math.round(d3.quantile(vals, q)*100) / 100 )
			qt_names.push(Math.round(Math.max(...vals)*100)/100)

			for (let i = 0; i < qt_names.length - 1; i++)
				qt_names[i] = (i == 0 ? "[ " : "] ") + qt_names[i] + ", " + qt_names[i+1] + " ]"

			// create a d3 scaleQuantile 
			var qtile = d3.scaleQuantile().domain(vals).range(qt_ranges)

			// calculate the quantile for each value and store it in qcolname of data
			data = data.map(function(x) { x[ qcolname ] = qt_names[ qtile(x[ colname ]) ]; return x })
			
			// return an dict describing this quantile processing
			return {
				num_quantiles: num_quantiles,
				quantile_names: qt_names.slice(0, qt_names.length - 1)
			};
		}

		var data = $scope.data
		var class_cols = $scope.columns.filter(x => x.checked)

		// calculate quantiles for numeric data
		var class_names = []
		for (var col of class_cols) {
			if (col.type == "Numeric") {
				var qinfo = calculateQuantiles(col.name, col.name + "_Qt", col.quantiles)

				console.log(qinfo)

				class_names.push(col.name + "_Qt")
			}
			else {
				class_names.push(col.name)
			}
		}

		var pie_name = $scope.panel.selectedPie.name
		var pie_levels = $scope.panel.selectedPie.info.levels
		if ($scope.panel.selectedPie.type == "Numeric") {
			var qinfo = calculateQuantiles($scope.panel.selectedPie.name, $scope.panel.selectedPie.name + "_pieQt", $scope.panel.pieQuantiles)

			pie_name = $scope.panel.selectedPie.name + "_pieQt"
			pie_levels = qinfo.quantile_names
		} 

		var color_list = $scope.colors[ pie_levels.length ]

		$scope.pieInfo = { 
			colors: color_list,
			quantiles: pie_levels };

		$scope.pieQuantiles = pie_levels.map((q, i) => { return { name: q, color: color_list[i] }; })

		if ($scope.data) {
			$scope.treedata = make_tree($scope.data, class_names, pie_name, pie_levels, "All")
		} else {
			$scope.treedata = null
		}
	}

	$scope.loadDataset = function() {
		// load the data
		d3.tsv($scope.panel.selectedDataset, function(error, data) { 
			if (error) throw error;

			$scope.data = data;
			$scope.columns = Object.keys(data[0]).map(function(key) { 
				var vals = data.map(x => x[ key ])

				var numericVals = vals.filter(function(n) { return !isNaN(parseFloat(n)) && isFinite(n) })
				var isNumeric = (numericVals.length == vals.length && Array.from(new Set(vals)).length > 8)
				
				var columnInfo;
				if (isNumeric) {
					columnInfo = {
						min_value: Math.min(...numericVals),
						max_value: Math.max(...numericVals)
					};
				} else {
					columnInfo = {
						levels: Array.from(new Set(vals)).sort()
					};
				}
	
				return { name: key,
						 displayName: isNumeric ? key + " [" + columnInfo.min_value + ", " + columnInfo.max_value + "]" : key + " (" + columnInfo.levels.length + ")",
						 type: isNumeric ? "Numeric" : "Categorical",
						 info: columnInfo,
						 quantiles: 2,
						 isValid: isNumeric || columnInfo.levels.length <= 10 };
			})

			$scope.class_columns = []
			$scope.pie_column = []

			$scope.$apply();
		});
	}

	$scope.panel = {
		isDatasetOpen: true,
		isColumnsOpen: true,
		isPieOpen: true,
		selectedPie: null,
		pieQuantiles: 4,
		datasets: [ "datasets/iris.tsv", "datasets/mtcars.tsv" ],
		selectedDataset: "datasets/iris.tsv"
	};

	$scope.loadDataset();
}]);


