'use strict';

angular.module('pingpongApp')
	.directive('testVis', function() {
		return {
			/*link: function(scope, element, attrs) { 
				scope.$watch('data', function(newData, oldData) {
		            if(newData){
		                console.log(newData);
		            }
           		}, true);
			},*/
			template: "<p> {{ data.length }} <p>"
		}
	});

	//.directive('')

