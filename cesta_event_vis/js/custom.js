/*custom js*/
$(document).ready(function() {
	$(".help-tip > div .glyphicon.glyphicon-remove").click(function(){
		$("#help-container").css('display', 'none');
	});
	$(".main-menu-item i.material-icons.small").click(function(){
		$(".main-menu-item").toggleClass("d-none");
	});
	$(".btn.btn-outline-secondary.menu-ico").click(function(){
		$(".main-menu-item").toggleClass("d-none");
	});
	
	$(".main-menu-item .has-submenu").click(function(){
		$(this).siblings(".sub-menu.elementor-nav-menu--dropdown").toggleClass("d-none");
		$(this).children(".has-submenu .glyphicon").toggleClass("glyphicon-menu-down");
		$(this).children(".has-submenu .glyphicon").toggleClass("glyphicon-menu-up");
	})

	$(".toggle-sub").click(function (event) { 
		event.stopPropagation(); 
		$(".dropdown-sub-menu").toggleClass("d-none"); 
		return false;
	}); 
	$(document).click(function(event){
		var _con = $(".dropdown-sub-menu");
		if(!_con.is(event.target) && _con.has(event.target).length === 0){
			$(".dropdown-sub-menu").addClass("d-none");
		}
	});
});