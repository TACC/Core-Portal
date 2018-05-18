(function($) {
	function showHideTickets(show) {
	console.log('show: ' + show);
		if (show === 'all') {
			$('.tickets').addClass('all');
			$('.tickets').removeClass('none');
		} else {
			$('.tickets').addClass('none');
			$('.tickets').removeClass('all');
			$('.tickets.' + show).removeClass('none');
		}

		if ($('.tickets.' + show + ' .ticket').length == 0) {
			$('.empty').removeClass('none');		
		} else {
			$('.empty').addClass('none');
		}

	}

	$(document).ready(function() {
	    console.log('running show/hide func');
		showHideTickets($('#select option:selected').val());

		$('#select').on('change', function() {
		console.log('select was changed');
			showHideTickets($('#select option:selected').val());
		});

		$(".search").keyup( function() {
			var searchTerms = $(this).val();
			if (searchTerms != "") {
				$(".ticket").filter( function() {
					return !$(this).is(":contains('" + searchTerms + "')");
				}).addClass("none");

				$(".ticket").filter( function() {
					return $(this).is(":contains('" + searchTerms + "')");
				}).removeClass("none");
			} else {
				$(".ticket").removeClass("none");
			}
		});

		$('.errorlist').each(function() {
			$(this).addClass('none');
			$(this).next('p').addClass('required');
		});

	});
})(jQuery);
