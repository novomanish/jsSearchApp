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
    }
};
var Bind = utils.bind = function(f, scope){
    return function(){
        return f.apply(scope, arguments);
    };
};
var Node = utils.node = {
    get: function(querySelector){
        return new NodeWrapper(document.querySelector(querySelector));
    }
};

var EventManager = utils.em = {
    trigger: function(evtName, data){
        var e = new CustomEvent(evtName, {detail: data});
        dispatchEvent(e);
    },
    on: function(evtName, callback){
        addEventListener(evtName, function(e){
            callback(e.detail);
        });
    }
};
var EVENT_AJAX_START = "ajax:start";
var EVENT_AJAX_STOP = "ajax:stop";

var Ajax = utils.ajax = {
    _init: function(){
    },
    _onLoadWrapper: function(pid, callback, errorCallback){
        return function(r){
            utils.em.trigger(EVENT_AJAX_STOP, pid);

            var ct = r.currentTarget;
            if(ct.status == 200){
                callback(ct);
            }else{
                if(errorCallback){
                    errorCallback(ct);
                }
            }
        };
    },
    get: function(args){
        var pid = utils.pig.next();
        args.pid = pid;
        utils.em.trigger(EVENT_AJAX_START, args);

        Ajax.req = new XMLHttpRequest();
        Ajax.req.addEventListener("load", Ajax._onLoadWrapper(pid, args.success, args.error));
        Ajax.req.open("GET", args.url, true);
        Ajax.req.send();

    }
};
Ajax._init();

var ProcessIdGenerator = utils.pig = {
    _pid: 0,
    next: function(){
        return "pid:"+ProcessIdGenerator._pid++;
    }
};
var ProgressBar = utils.pb = {
    _subs: {},
    _poll: function(){
        var keys = Object.keys(ProgressBar._subs);
        if(keys.length > 0){
            ProgressBar._show(ProgressBar._subs[keys[0]]);
        }else{
            ProgressBar._hide();
        }
    },
    _show: function(arg){
        var n = utils.node.get(".progress-bar");
        n.show();
        n.html(arg.title);

    },
    _hide: function(){
        var n = utils.node.get(".progress-bar");
        n.hide();
    },
    init: function(){
        utils.em.on(EVENT_AJAX_START, function(args){
            if(args.title){
                ProgressBar.que(args);
            }
        });
        utils.em.on(EVENT_AJAX_STOP, function(args){
            ProgressBar.unQue(args);
        });
    },
    que: function(arg){
        ProgressBar._subs[arg.pid] = arg;
        ProgressBar._poll();
    },
    unQue: function(pid){
        var deleted = delete(ProgressBar._subs[pid]);
        ProgressBar._poll();
        return deleted;
    }
};
ProgressBar.init();

})();