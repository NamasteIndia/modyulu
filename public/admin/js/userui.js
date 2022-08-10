$( function() {
    // Khai bao BOX co the DROP & DRAG
    $(".sortable").sortable({
        placeholder: "ui-state-highlight",
        start: function( event, ui ) {
            var id=ui.item.attr("id");
            tinymce.remove(`#${id} .tinymce`);
        },
        stop: function( event, ui ) {
            var id=ui.item.attr("id");
            tinyInitOption.selector = `#${id} .tinymce`;
            tinymce.init(tinyInitOption);
        }
    });    
    // Su kien khi di chuyen position cac BOX
    $(".sortable").droppable({
        drop: function( event, ui ) {            
            setTimeout(addUserUi, 100);
        }
    });                       
    // Sort BOX trong Left Side va Right Side
    function sort_accordion_position(a, b){
        return ($(b).data('position')) < ($(a).data('position')) ? 1 : -1;
    }
    // Load UI khi vao trang
    var strJsonScreenUi = "";
    loadScreenUi();
    function loadScreenUi(){
        var screenid = $(".sortable-wrapper").attr("id") || "";                
        $.ajax({
            method: "GET",
            url: `/${dashboard}/userui/info/${screenid}`,
            success: function(rs){            
                if(rs.code == 1 && rs.data !== null && rs.data.jsontext !== null){
                    try{
                        strJsonScreenUi = rs.data.jsontext;
                        var json = JSON.parse(rs.data.jsontext);
                        // Gan position index vao cac BOX
                        $.each(json, function(index, item){                                    
                            var itemDom = $(`.sortable #${item.item}`);
                            if(item.state){
                                itemDom.find(".collapse").addClass("show");
                            }else{
                                itemDom.find(".collapse").removeClass("show");
                            }
                            itemDom.data("position", item.position);
                        });
                        // Duyet cac BOX de sort theo position
                        var parents = $(".sortable");
                        $.each(parents, function(index, item){
                            var parentDom = $(item);
                            parentDom.find(".accordion-ui").sort(sort_accordion_position).appendTo(parentDom);
                        });
                    }catch(err){}
                }
            }
        });
    }
    // Luu User UI khi co thay doi position cac BOX
    function addUserUi(){
        var arr = [];
        var index = 0;
        var screenid = $(".sortable-wrapper").attr("id") || "";
        $.each($(".sortable"), function(stIndx, sortable){
            $.each($(sortable).find(".accordion-ui"), function(itemIndx, accordion){
                var collapse = $(accordion).find(".collapse");
                var stateCollapse = collapse.hasClass("show");
                var parentId = $(sortable).attr("id");                       
                var itemId = $(accordion).attr("id");
                if(parentId!==undefined){
                    arr.push({id: parentId, item: itemId, position: index, state: stateCollapse});
                }
                index++;
            });                        
        });
        var jsontext = JSON.stringify(arr);
        var data = {};
        data.jsontext = jsontext;
        data.screenid = screenid;
        if(strJsonScreenUi !== jsontext){
            strJsonScreenUi = jsontext;
            $.ajax({
                method: "POST",
                url: `/${dashboard}/userui/add`,
                data: data,
                success: function(rs){}
            })
        }
    }
    // Thuc hien reset UI cua page ve mac dinh
    $("body").on("click", ".btn-reset-screenui", function(e){
        e.preventDefault();
        swal.fire({
            icon: 'warning',
            title: 'Are you sure?',                    
            showCancelButton: true,
            cancelButtonText: 'Cancel',
            confirmButtonText: 'Ok'
        }).then((result) => {
            if (result.value) {
                var screenid = $(".sortable-wrapper").attr("id") || "";
                $.ajax({
                    method: "delete",
                    url: `/${dashboard}/userui/delete/${screenid}`,
                    success: function(rs){
                        if(rs.code == 1){
                            window.location.reload();
                            //loadScreenUi();
                        }
                    }
                })
            }
        })
    })
});