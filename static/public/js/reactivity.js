/**
 * 
 */

var Reactivity = (function( oConfig){

	return { // publicly accessible API
            setupCards : function(){
				$('.rising-card').hover(function () {
					$(this).removeClass('w3-card-2');
					$(this).addClass('w3-card-4');
				}, function () {
				   $(this).removeClass('w3-card-4');
					$(this).addClass('w3-card-2');
				});
		
				$('.low-rising-card').hover(function () {
					$(this).removeClass('w3-card');
					$(this).addClass('w3-card-2');
				}, function () {
				   $(this).removeClass('w3-card-2');
					$(this).addClass('w3-card');
				});
			},
     };
})();
