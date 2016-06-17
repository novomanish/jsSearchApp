(function(){
var utils = window.u = window.u || {};
var DataService = utils.ds = {
    _lastResponse:null,
    _cache: function(r){
        DataService._lastResponse = r;
    },
    _callbackWrapper: function(pid, callback){
        return function (response) {
            utils.em.trigger(utils.em.EVENT_PROCESS_STOP, pid);
            if (response && !response.error) {
                console.log(response);
                DataService._cache(response);
                if(callback) callback(response);
            }
        };

    },
    search: function(query, callback){
        /* make the API call */
        var searchArg = {pid: utils.pig.next(), title:"Searching "+query};
        utils.em.trigger(utils.em.EVENT_PROCESS_START, searchArg);

        //1152877258068612, search
        FB.api(
            "/search",
            {
                "q": query,
                "fields": "id,name, about, description, release_date",
                "type": "page",
                "access_token": FB_ACCESS_TOKEN
            },
            DataService._callbackWrapper(searchArg.pid, callback)
        );
    },
    page: function(pageId, callback){
        var searchArg = {pid: u.pig.next(), title:"Loading Page"};
        u.em.trigger(u.em.EVENT_PROCESS_START, searchArg);

        FB.api(
            "/"+pageId,
            {
                "fields": "id, name, about, description, release_date",
                "type": "page",
                "access_token": FB_ACCESS_TOKEN
            },
            DataService._callbackWrapper(searchArg.pid, callback)
        );
    },
    _pageByUrl: function(url, title, callback){
        utils.ajax.get({title:title, url: url, success: function(response){
            var r = JSON.parse(response.responseText);
            if (r && !r.error) {
                console.log(r);
                DataService._cache(r);
                if(callback) callback(r);
            }
        }});
    },
    next: function(callback){
        var url = DataService._lastResponse.paging.next;
        var title = "Fetching Next Page";
        DataService._pageByUrl(url, title, callback);
    },
    previous: function(callback){
        var url = DataService._lastResponse.paging.previous;
        var title = "Fetching Previous Page";
        DataService._pageByUrl(url, title, callback);
    },
    fav: function(pageId){
        var data = DataService._lastResponse.data.find(function(it){
            return it.id === pageId;
        });

        var favSet = localStorage.getItem("favSet");
        if(favSet){
            favSet = JSON.parse(favSet);
        }else{
            favSet = {};
        }

        favSet[pageId] = data;
        localStorage.setItem("favSet", JSON.stringify(favSet));
    },
    unFav: function(pageId){
        var favSet = localStorage.getItem("favSet");
        if(favSet){
            favSet = JSON.parse(favSet);
            delete(favSet[pageId]);
            localStorage.setItem("favSet", JSON.stringify(favSet));
        }
    },
    getFavIds: function(){
        var favSet = localStorage.getItem("favSet");
        if(favSet){
            favSet = JSON.parse(favSet);
            return Object.keys(favSet);
        }else{
            return [];
        }
    },
    getFavs: function(callback){
        var r = {data:[]};
        var favSet = localStorage.getItem("favSet");
        if(favSet){
            favSet = JSON.parse(favSet);
            for(var id in favSet){
                var d = favSet[id];
                r.data.push(d);
            }
        }
        console.log(r);
        DataService._cache(r);
        if(callback) callback(r);
        return r;
    }
};
})();