jQuery.Controller.extend('ApiPlayground.Controllers.MainController',
/* @Static */
{
	onDocument : true
},
/* @Prototype */
{
	load : function() {	
		$(window).resize(function() {
			h = $(window).height();		
			$("#type-nav").css("min-height", h+"px");
		});
		$(window).resize();
	
		this.calls = {};
		this.payload_box = $("#payload");
		this.response_box = $("#response");
		this.payload_box.hide();
		this.response_box.hide();
		
		var ORIGIN = null, FRAME = window.top;
	
		SMART = new SMART_CLIENT(ORIGIN, FRAME);
			
		SMART.send_ready_message(function(user_and_record_context) {		
			ApiType.interpolations.record_id = user_and_record_context.record.id;
			ApiType.addInterpolationValue("record_id", user_and_record_context.record.id);
			ApiType.find_all_types_and_calls();
		});
    },
    
    'ontology_parsed subscribe': function(topic, element) {
		$("#type-nav").html(this.view('groups', {groups: ApiCallGroup.get_top_groups()}));
		$("#wrap").css({marginLeft: $("#type-nav").width()});
    }, 

    ".type click": function(el, ev ){
		var g = el.closest(".type").model();
		this.selected_top_group = g;
		g.element = el;
		
		$("#type-heading").html(this.view('calls', {group: g}));
		//console.log("chose type " + t.name);
		this.payload_box.hide();
		this.response_box.hide();
		this.response_box.html("");
		$("#interpolation-fields").html("");
		g.group_type.fetchParameters();
    },
    
    "BUTTON.call click": function(el, ev)
    {

    	var c = el.closest(".call").model();
		this.selected_call = c;
		var method = c.method;
		
		//console.log("chose "+el.text()+" call " + c.targets.join(", ")  + c.type.example);

		if ($.inArray(method, ApiCall.payload_methods) !== -1)
		{
			this.payload_box.val(this.selected_top_group.group_type.example);	
			this.payload_box.show();	
		} else  {
			this.payload_box.val("");
			this.payload_box.hide();
		}

		this.response_box.hide();
		this.response_box.html("");
		
		$("#interpolation-fields").html(this.view('interpolations', {type: this.selected_top_group.group_type, 
																	 call: this.selected_call}));
		
		$("#interpolation-fields INPUT").each(function() {
			$i = $(this);
			var field_name = $i.attr("field_name");
			
			var compfunc = function(request, response) {
				try {
				//console.log("looking up " + field_name + ": " + ApiType.interpolations.lists[field_name].join(", "));
				response(ApiType.interpolations.lists[field_name]);
				} catch(err) {response([]);}
			};
			
			$i.autocomplete(
				{source: compfunc,
				 minLength: 0, 
				 delay: 0,
				 close: function() {$(this).data("close_handled", false);}})
				.focus(function () {					
				 		var close_handled = $(this).data("close_handled");
						if (close_handled) {
						   $(this).keydown(); 
						}					
				 		$(this).data("close_handled", true);					
				}).data("close_handled", true);
			try  {$i.val(ApiType.interpolations.lists[field_name][0]);} catch(err){}
			
		});
    },

    "BUTTON.cancel-call click": function(el, ev) {
    	this.selected_top_group.element.click();
    
    },
    
    "BUTTON.complete-call click": function(el, ev) {
    	$(".cancel-call").attr("DISABLED", "true");
		$(".complete-call").attr("DISABLED", "true");
	
    	$("#interpolation-fields INPUT").each(function() {
			$i = $(this);
			var field_name = $i.attr("field_name");    		
    		ApiType.interpolations[field_name] = $i.val();
    		$i.attr("DISABLED", "true");
    	});
    	
    	this.selected_call.callAPI( this.payload_box.val(), 
    								this.callback(this.receivedResult))
    },
    
    receivedResult: function(contentType, data) {
    	
    	//console.log("got data" + contentType + data);
    	this.response_box.text("Response:\n\n"+data);
		this.response_box.html(this.response_box.html()
				.replace(/\n/g, "<br>"));
    	this.response_box.show();
	
    	$(".cancel-call").removeAttr("DISABLED");
		$(".complete-call").removeAttr("DISABLED");
    	$("#interpolation-fields INPUT").each(function() {
			$i = $(this);
    		$i.removeAttr("DISABLED");
    	});

    	this.selected_top_group.group_type.fetchParameters();		
    }
    
});