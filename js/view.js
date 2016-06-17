(function(){
var utils = window.u = window.u || {};

var NodeWrapper = function(node){
    this.node = node;
};
NodeWrapper.prototype = {
    html: function(html){
        if(undefined === html){
            return this.node.innerHTML;
        }else{
            this.node.innerHTML = html;
        }
        
    },
    show: function(){
        this.node.style.display = "";
    },
    hide: function(){
        this.node.style.display = "none";
    },
    parent: function(){
        return new NodeWrapper(this.node.parentNode);
    },
    find: function(querySelector){
        return new NodeWrapper(this.node.querySelector(querySelector));
    },
    addClass: function(toAdd){
        var alreadyExisting = false;
        var className = this.node.className;
        var split = className.split(" ");
        for(var i=0; i<split.length; i++){
            var cn = split[i];
            if(cn === toAdd){
                alreadyExisting = true;
                break;
            }
        }
        if(!alreadyExisting){
            this.node.className = className + " "+ toAdd;
        }
    },
    removeClass: function(toRemove){
        var className = this.node.className;
        var split = className.split(" ");
        var newClassNames = [];
        for(var i=0; i<split.length; i++){
            var cn = split[i];
            if(cn != toRemove){
                newClassNames.push(cn);
            }
        }
        this.node.className = newClassNames.join(" ");
    }
};

var View = utils.view = {
    node: function(querySelector){
        if(querySelector instanceof NodeWrapper){
            return querySelector;
        }else if(querySelector instanceof Element){
            return new NodeWrapper(querySelector);
        }else{
            return new NodeWrapper(document.querySelector(querySelector));
        }
    },
    selectLi: function(li){
        var liw = View.node(li);
        liw.parent().find(".active").removeClass("active");
        liw.addClass("active");
    }
};

RegExp.escape= function(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};
var Template = View.template = {
    _clean: function(html){
        return html.replace(/\{\{\w+\}\}/g, "");
    },
    merge: function(template, data){
        var html = "";
        if(data instanceof Array){
            for(var i=0; i< data.length; i++){
                var d = data[i];
                html += Template._merge(template, d);
            }
        }else{
            html = Template._merge(template, data);
        }
        return Template._clean(html);
    },
    _merge: function(template, data){
        var html = template;
        for(var key in data){
            if(data.hasOwnProperty(key)){
                html = html.replace(new RegExp(RegExp.escape("{{"+key+"}}"), "g"), data[key]);
            }
        }
        return html;
    }
};


function clone(obj) {
    if (obj === null || typeof(obj) !== 'object' || 'isActiveClone' in obj){
        return obj;
    }
    var temp;
    if (obj instanceof Date){
        temp = new obj.constructor(); //or new Date(obj);
    }else{
        temp = obj.constructor();
    }

    for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          obj['isActiveClone'] = null;
          temp[key] = clone(obj[key]);
          delete obj['isActiveClone'];
        }
    }

    return temp;
}

var SearchView = View.SearchView = {
    init: function(){
        var btn = View.node(".search-button");
        btn.node.addEventListener("click", SearchView.search);
    },
    search: function(){
        var input = View.node(".search-input");
        var value = input.node.value;
        if(value && value.trim()){
            utils.ds.search(value, SearchResultView.render);
        }
    }
};
var SearchResultView = View.SearchResultView = {
    _parse: function(data){
        var cdata = clone(data);
        if(cdata instanceof Array){
            cdata.forEach(SearchResultView._parseObj);
        }else{
            SearchResultView._parseObj(cdata);
        }
        return cdata;
    },
    _parseObj:function(data){
        if(data.favorite === true || data.favorite === "true"){
            data.star = "on";
        }else{
            data.star = "off";
        }
    },
    render: function(response){
        var data = response.data;
        var template = View.node("#searchLiTemplate").html();
        var parsedData = SearchResultView._parse(data);

        var html = View.template.merge(template, parsedData);
        var ul = View.node(".list-container");
        ul.html(html);
    }
};

})();