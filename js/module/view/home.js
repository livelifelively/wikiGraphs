// wikipedia has flat sequencial document structure. all significant text items are siblings.

define(['vendor/backbone', 'kinvey', 'app', 'BaseLoggedInView', 'HomeModel', 'xDomainAjax', 'bootstrapJS', 'D3', 'topoJson', 'text!module/html/home.html'], function (Backbone, Kinvey, App, BaseLoggedInView, HomeModel, xDomainAjax, bootstrapJS, d3, topoJson, homeHtml) {
  "use strict";

var HomeView = BaseLoggedInView.extend({
  tagName: "div",
  id: "homePage",
  template: _.template(homeHtml),
  model: new HomeModel(),
  
  pageEvents: {
    "click #getDataFromPage" : "getDataFromPage"
  },
  
  tableRowsObject: {},
  returnJson : [],
  tables: $(),
  fetchedHTML: {},
  
  render: function () {
    this.$el.html(this.template());
    return this;
  },
  
  getDataFromPage: function(){
    var self = this;
    this.model.set({wikiUrl: $("#webAddress").val()}); // get the input link
    
	// HOW TO DO THIS: this.fetchPage(this.model.get('wikiUrl'), self.sampleCallback()); using a sibling function as callback is giving error... how to implement this?
	
	this.fetchPage(this.model.get('wikiUrl'), function(fetchedPageHTML){
      // insert content into #pageCache to convert it into HTML DOM element.
	  self.fetchedHTML = $(fetchedPageHTML);
	  $("#pageCache").html($("<div></div>").html(fetchedPageHTML).children("#content"));
      self.tables = $("#pageCache table.wikitable");
	  
	  self.tableToJson();
    });
  },
  
  getHeadingsContextForTable: function(table, pointer){
    var headings = {
		h1: $("#pageCache h1").text(),
		h2: "",
		h3: ""
	};
	
    table.prevUntil($("h1"), "h2").each(function(i){
	  var headline = $(this).find("span.mw-headline").text();  
	  headings['h2'] = headings['h2'] || headline;
    });
	  
	table.prevUntil($("h2"), "h3").each(function(i){
	  var headline = $(this).find("span.mw-headline").text();  
	  headings['h3'] = headings['h3'] || headline;
    });
	  
	return headings;
  },
  
  tableToJson: function(){
    // for every table
    var self = this;
    var tables = self.tables;
	var pointer = $();
	
    tables.each(function(i){
      self.tableRowsObject = $(this).find("tr");
      
      // TODO : get the previous heading element and hierarchy of heading elements 
	  
      // the titles of the table
      var tableTitles = self.pickUpDataTitles();
      // the content of the table
      var tableData = self.fetchRows();
      
	  var headings = self.getHeadingsContextForTable($(this), pointer);
	  
      // push the titles and data in the array
      self.returnJson[i] = {
        'originalTitles': new Backbone.Model(tableTitles),
        'data': new Backbone.Collection(tableData),
		'context': new Backbone.Model(headings)
	  };
	  
	  pointer = $(this);
    });
	
    //console.log(self.returnJson);
	this.model.set({fetchedData: self.returnJson});
	console.log(this.model);
	// hide the 
	$("#fetchTableForm").hide();
	$("#generateGraphForm").show();
	this.generateEditableTables();
  },
  
  respondKeyDown : function(e){
	if (this.keyDownResponse[e.keyCode]){
      this[this.keyDownResponse[e.keyCode]]();
    } 
  },
  
  fetchPage: function(inputURL, callback){
	$.ajax({
	  url: inputURL,
	  type: 'GET',
	  beforeSend: function(){
		$('#loadingModal').modal({backdrop: 'static'});
	  },
	  success: function(res) {
		var text = res.responseText;
		$('#loadingModal').modal('hide');
		$("#fetchedTables").show();
		callback(text);
	  },
	  error: function(err){
		console.log(err);
		alert("Error Occured, Check Console");
	  }
	});
  },
  
  generateEditableTables: function(){
    // this.returnJson
    // use underscore here.
    // divide the problem into parts and for each part implement underscore functionalities.
    // 
	self = this;
	
	var allTables = document.getElementById("allTables");
    
	var createTable = function(){
	  return $("<table class='table table-striped table-hover table-bordered'></table>");
	};
	
	var createResponsiveTableWrapper = function(){
		return $('<div class="table-responsive"></div>');
	}
	
	var createRow = function(){
	  return $("<tr></tr>");
	};
	
	var createCell = function(contentHTML){
		return $("<td>"+contentHTML+"</td>");
	}
	
	var createTitleCell = function(contentHTML){
		return $("<th>"+contentHTML+"</th>");
	}
	
	var processCellContent = function(content){
		return $("<span>"+content+"</span>");
	}
	
	var context = function(h1, h2, h3){
		return $('<ol class="breadcrumb">' +
					'<li>'+h1+'</li>' +
					'<li>'+h2+'</li>' +
					'<li class="active">'+h3+'</li>' +
				'</ol>');
	};
	
	var tables = self.model.get('fetchedData');
	
	_.each(tables, function(table){
		// the headings collection
		var contextHtml = context(table.context.get("h1"), table.context.get("h2"), table.context.get("h3"));
		
		var tableUnit = $('<div class="tableUnit"></div>');
		var tableHtml = createTable();
		var responsiveWrapper = createResponsiveTableWrapper();
		
		tableUnit.append(contextHtml);
		
		var rowHtml = createRow();
		
		// the originalTitles collection
		_.each(table.originalTitles.attributes, function(attr, index){
			(typeof attr == 'string') ? 
				rowHtml.append(createTitleCell(attr)) : 
				rowHtml.append(createTitleCell(attr.originalText));
		})
		tableHtml.append(rowHtml);
		
		// the data collection 
		table.data.each(function(model){
			rowHtml = createRow();
			_.each(model.attributes, function(attr, index){
				(typeof attr == 'string') ? 
					rowHtml.append(createCell(attr)) : 
					rowHtml.append(createCell(attr.originalText));
			});
			tableHtml.append(rowHtml);
		});
		
		responsiveWrapper.append(tableHtml)
		tableUnit.append(responsiveWrapper);
		$(allTables).append(tableUnit);
	});
  },
  
  /** 
    
  */
  
  pickUpDataTitles: function(){
    // the header of the table
    var titleRow = $(this.tableRowsObject[0]);
    var self = this;
    var tableTitles = [];
    var cellValue;
    var matchForBrackets;
    
    titleRow.children().each(function(){
      // remove the citation links
      $(this).find("sup").remove();
      
      cellValue = $(this).text().replace(/\s+/g,' ').trim();
      
      matchForBrackets = self.checkForAndReturnStringsInBracketsInInputString(cellValue);
      
      if (matchForBrackets){
        // if there is bracketed content, put it into sub array
        cellValue = matchForBrackets;
      }
      
      // push into the titles row.
      tableTitles.push(cellValue);
    });
    
    return tableTitles;
  },
  
  checkForRepeatitionOfSubstringInInputString: function(text, substring){
    if (text.indexOf(substring) !== text.lastIndexOf(substring)){
      return true;
    }
    return false;
  },
  
  checkForAndReturnStringsInBracketsInInputString: function(text){
    // remove content brackets
    var regExp = /\(([^)]+)\)/;
    var matches = regExp.exec(text);
    var returnValue = [];
    var originalText = text;
    
    if (matches != undefined){
      // if the parentheses are repeated within the content, extract content within
      while(this.checkForRepeatitionOfSubstringInInputString(text, "(")){
        // cut out the substring
        returnValue.push(matches[1].trim());
        text = text.replace(matches[0].trim(), "");
        matches = regExp.exec(text);
      }
      
      // add text to the return values;
      returnValue.push(matches[1].trim());
      text = text.replace(matches[0].trim(), "");
      
      return { 'originalText': originalText, 'text': text.trim(), 'bracketValues': returnValue };
    }
    
    return false;
  },
  
  // fetch the rows from table. return the array of all the data.
  fetchRows: function(){
    var rowObject = {};
    var dataArray = [];
    var self = this;
    var cellValue;
    var temp;
	var matchForBrackets;
    
    // from second row of the table onward (next to the titles row)
    for(var i=1; i < self.tableRowsObject.length; i++){
      // initialize row as empty.
      rowObject = {};
      
      // for every row, extract the data and push into rowObject.
      $(this.tableRowsObject[i])
        .children()
        .each(function(j){
            // remove the hidden sort value for multivalue columns. 
			
			$(this).children().each(function(i){
				var $this = $(this);
				
				// remove all the elements with display:none, .sortkey or <sup class="reference">
				$(this).filter(function(){
					return $this.css("display") == "none" ||
						   $this.hasClass("sortkey") ||
						   ($this.prop("tagName").toLowerCase() == "sup" && $this.hasClass("reference"));
				}).remove();
				
				// fetch the data in braces.
			});
			
            // remove extra spaces
            cellValue = $(this).text().replace(/\s+/g,' ').trim();
            
			// for a big number with commas in between, split it and rebuild it
            temp = self.ifCommaSeparatedNumberReturnInteger(cellValue);
            if (!temp[0]){
              cellValue = temp[1];
            }
			
			matchForBrackets = self.checkForAndReturnStringsInBracketsInInputString(cellValue);
			
		    if (matchForBrackets){
			  // if there is bracketed content, put it into sub array
			  cellValue = matchForBrackets;
			  console.log(cellValue);
		    }
			rowObject[j] = cellValue;
          });
      
      // push rowObject into returnJson array. this is the data json we are looking for
      dataArray.push(rowObject);
    }
    return dataArray;
  },
  
  ifCommaSeparatedNumberReturnInteger: function(num){
    num = num.split(',').join('');
    return [isNaN(parseFloat(num)), num];
    // count and remove commas and dots. 
  },
  
  generateGraph: {
	  
  }
});
  
  return HomeView;
});
