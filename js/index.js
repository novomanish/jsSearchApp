window.onload = function(){
    var params = {
        title: "Checking...",
        url: "http://graph.facebook.com/v2.6/314907475302956",
        success: function(r){
            console.log(r);
        }
    };
    //u.ajax.get(params);
};