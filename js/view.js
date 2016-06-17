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
    hasClass: function(className){
        if(!this.node) return;
        var alreadyExisting = false;
        var cns = this.node.className;
        var split = cns.split(" ");
        for(var i=0; i<split.length; i++){
            var cn = split[i];
            if(cn === className){
                alreadyExisting = true;
                break;
            }
        }
        return alreadyExisting;
    },
    addClass: function(toAdd){
        if(!this.node) return;
        
        if(!this.hasClass(toAdd)){
            var className = this.node.className;
            this.node.className = className + " "+ toAdd;
        }
    },
    removeClass: function(toRemove){
        if(!this.node) return;
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
        btn.node.form.addEventListener("submit", function(e){
            SearchView.search();
            e.preventDefault();
            return false;
        });

        var favLink = View.node("#Favorites");
        favLink.node.addEventListener("click", function(e){
            SearchView.fav();
            e.preventDefault();
            return false;
        });

    },
    search: function(){
        var input = View.node(".search-input");
        var value = input.node.value;
        if(value && value.trim()){
            utils.ds.search(value, SearchResultView.render);
        }
    },
    fav: function(){
        utils.ds.getFavs(SearchResultView.render);
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
        if(response.paging){
            html += "<li class='resultPaging'>&nbsp;";
            if(response.paging.previous){
                html += "<a href='javascript:;' class='resultPreviousPage'>Previous</a>";
            }
            if(response.paging.next){
                html += "<a href='javascript:;' class='resultNextPage'>Next</a>";
            }
            html +="</li>";
        }

        ul.html(html);

        Array.prototype.forEach.call(ul.node.querySelectorAll("li"), function(li){
            var liw = View.node(li);
            li.addEventListener("click", function(e){
                if(!liw.hasClass("resultPaging")){
                    View.selectLi(li);
                    var pageId = li.getAttribute("data-id");
                    utils.ds.page(pageId, PageView.render);
                }else{
                    var trw = View.node(e.target);
                    if(trw.hasClass("resultPreviousPage")){
                        utils.ds.previous(SearchResultView.render);
                    }else{
                        utils.ds.next(SearchResultView.render);
                    }
                    
                }
            });
        });

        var favPageIds = utils.ds.getFavIds();

        Array.prototype.forEach.call(ul.node.querySelectorAll(".star"), function(starEl){
            var stw = View.node(starEl);
            var liw = stw.parent().parent();
            var pageId = liw.node.getAttribute("data-id");

            // Decorating star
            if(favPageIds.indexOf(pageId) > -1){
                stw.removeClass("star_off");
                stw.addClass("star_on");
            }


            stw.node.addEventListener("click", function(e){
                if(stw.hasClass("star_off")){
                    utils.ds.fav(pageId);
                    stw.removeClass("star_off");
                    stw.addClass("star_on");
                }else{
                    utils.ds.unFav(pageId);
                    stw.removeClass("star_on");
                    stw.addClass("star_off");
                }
                e.stopPropagation();
            });
        });


    }
};

var PageView = View.PageView = {
    render: function(data){
        var template = View.node("#pageTemplate").html();
        var html = View.template.merge(template, data);

        if(data.posts.data){
            html += View.template.merge(View.node("#postTemplate").html(), data.posts.data);
        }


        var div = View.node(".content");
        div.html(html);
        div.node.scrollIntoView();
    }
};


})();