$(function() {
    // Khai bao MOD co event DRAG & DROP
    $("#modSortable").sortable({
        placeholder: "ui-state-highlight",
        start: function( event, ui ) {
            var id=ui.item.attr("id");
            tinymce.remove(`#${id} .modtinymce`);
        },
        stop: function( event, ui ) {
            var id=ui.item.attr("id");            
            tinyInitOption.selector = `#${id} .modtinymce`;
            tinymce.init(tinyInitOption);            
        }
    });
    //$("#modSortable").disableSelection();
    // Phat sinh su kien DROP MOD
    $("#modSortable").droppable({
        drop: function( event, ui ) {            
            setTimeout(submitSortMod, 100);   
        }
    });
    // Submit change numsort of MOD
    function submitSortMod(){
        var mods = $("#modSortable .mod"),
            length = mods.length;
        mods.each(function(indx, mod){
            let numsort = length - indx;
            $(mod).find(".modnumsort").val(numsort);
            if(indx==0){
                $(mod).find(".modnumsort").val(numsort);
            }
        });
    }    
    // Thêm link cho mod
    $('.mod-box').on("click", ".btn-add-modlink", function(e) {
        e.preventDefault();
        var $mod = $(this).closest(".mod");
        var boxModId = $mod.attr("id");
        var indx = $mod.attr("data-indx");
        var itemindx = $mod.attr("item-indx");
        $mod.attr("item-indx", parseInt(itemindx) + 1);
        $(this).closest(".mod").find(".mod-link-holder")
            .prepend(`<div class="ui-state-default mod-link mb-3">
                        <div class="mod-link-toolbar text-right">
                            <button class="btn btn-danger btn-sm btn-del-modlink rounded-0" title="Remove this link"><i class="fas fa-times"></i></button>
                        </div>
                        <div class="mod-link-body card pr-3 pl-3 rounded-0">
                            <div class="row">
                                <div class="col">
                                    <div class="form-group">
                                        <label for="mod[${indx}][item][${itemindx}][title]">Name</label>
                                        <input class="form-control" type="text" name="mod[${indx}][item][${itemindx}][title]" placeholder="Name">
                                        <input class="form-control modlinknumsort" type="hidden" name="mod[${indx}][item][${itemindx}][numsort]" value="${itemindx}">
                                    </div>
                                </div>
                                <div class="col">
                                    <div class="form-group">
                                        <label for="mod[${indx}][item][${itemindx}][size]">Size</label>
                                        <input class="form-control" type="text" name="mod[${indx}][item][${itemindx}][size]" placeholder="Size">
                                    </div>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="mod[${indx}][item][${itemindx}][link]">Link</label>
                                <input class="form-control" type="text" name="mod[${indx}][item][${itemindx}][link]" placeholder="Link">
                            </div>
                        </div>
                    </div>`);
        $(`body #${boxModId} .modlinkSortable`).sortable('refresh');
        // Phat sinh su kien DROP MOD Link
        $(`body #${boxModId} .modlinkSortable`).droppable({            
            drop: function( event, ui ) {
                setTimeout(submitSortModlink(boxModId), 100);
            }
        });
    });
    function submitSortModlink(boxModId){
        var modlinks =  $(`body #${boxModId} .mod-link`);
        var length = modlinks.length;
        modlinks.each(function(indx, modlink){
            let numsort = length - indx;
            $(modlink).find(".modlinknumsort").val(numsort);
        });
    }
    // thêm mod cho post
    $('.mod-box').on("click", ".btn-add-mod", function(e) {
        e.preventDefault();
        var length = $(".mod-box .mod").length;
        var boxModId = `mod-${length+1}`;
        $(this).closest(".mod-box").find("#modSortable")
            .prepend(`<div class="mod mb-3 open" id="${boxModId}" data-indx=${length} item-indx="0">
                            <div class="mod-toolbar">
                                <button class="btn btn-danger btn-sm btn-del-mod rounded-0" title="Remove this mod"><i class="fas fa-times"></i></button>
                                <button class="btn btn-primary btn-sm btn-add-modlink rounded-0" title="Add link"><i class="fas fa-plus"></i></button>
                            </div>
                            <div class="mod-body card rounded-0">
                                <div class="row">
                                    <div class="col-sm-12 col-md-6">
                                        <div class="form-group">
                                            <label for="mod[${length}][title]">Mod name</label>
                                            <input class="form-control modnumsort" type="hidden" name="mod[${length}][numsort]" value="${length}">
                                            <input class="form-control" type="text" name="mod[${length}][title]" placeholder="Mod name">
                                        </div>
                                    </div>
                                    <div class="col-sm-6 col-md-4">
                                        <div class="checkbox  mt-4">
                                            <input class="form-check-input showinsingle" type="checkbox" name="mod[${length}][showinsingle]" checked>
                                            <label class="form-check-label" for="mod[${length}][showinsingle]">Hiển thị Mod ra trang single</label>
                                        </div>                                        
                                    </div>
                                    <div class="col-sm-6 col-md-2">
                                        <div class="checkbox  mt-4">
                                            <input class="form-check-input isoriginal" type="checkbox" name="mod[${length}][isoriginal]">
                                            <label class="form-check-label" for="mod[${length}][isoriginal]">Original</label>
                                        </div>                                        
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="mod[${length}][description]">Description</label>
                                    <textarea name="mod[${length}][description]" class="modtinymce form-control" placeholder="Description"></textarea>
                                </div>
                                <div class="modlinkSortable mod-link-holder"></div>
                            </div>
                        </div>`);
            $(`body #${boxModId} .modlinkSortable`).sortable({placeholder: "ui-state-highlight"});            
            tinyInitOption.selector = `#${boxModId} .modtinymce`;
            tinymce.init(tinyInitOption);
            
    });
    // xóa link của mod
    $('.mod-box').on("click", ".btn-del-modlink", function(e) {
        e.preventDefault();
        swal.fire({
            icon: 'warning',
            title: 'Are you sure?',
            text: "Delete a mod link",
            showCancelButton: true,
            cancelButtonText: 'Cancel',
            confirmButtonText: 'Ok'
        }).then((result) => {
            if (result.value) {
                $(this).closest(".mod-link").remove();
            }
        });
    });
    // thêm mod của post
    $('.mod-box').on("click", ".btn-del-mod", function(e) {
        e.preventDefault();
        swal.fire({
            icon: 'warning',
            title: 'Are you sure?',
            text: "Delete a mod",
            showCancelButton: true,
            cancelButtonText: 'Cancel',
            confirmButtonText: 'Ok'
        }).then((result) => {
            if (result.value) {
                $(this).closest(".mod").remove();
            }
        });
    });
    $('.btn-leech').click(function(e) {
        e.preventDefault();
        var $this = $(this);
        $this.prop("disabled", true);
        var playstore_url = $('input[name="apk[playstore_url]"]').val();
        var posttype = $('input[name="apk[playstore_url]"]').attr("data-ptype");
        $.ajax({
            type: "POST",
            url: `/${dashboard}/post/post-apk/leech`,
            data: { playstore_url: playstore_url, posttype: posttype },
            success: function(data) {
                if (data.code == 0) {
                    swal.fire({
                        icon: 'warning',
                        title: data.message,
                        showConfirmButton: true
                    }).then(() => {
                        $this.prop("disabled", false);
                    });
                } else {
                    swal.fire({
                        icon: 'success',
                        title: data.message,
                        showConfirmButton: true
                    }).then(() => {
                        window.location.href = `${domain}/${dashboard}/post/${posttype}/edit/${data.data.id}`;
                    });
                }
            },
            error: function(error){
                swal.fire({
                    icon: 'error',
                    title: error.responseJSON.message,
                    showConfirmButton: true
                })
            }
        });
    })
    $("body").on("click", ".mod .mod-toolbar", function(e){
        e.preventDefault();
        var $this = $(this);
        $this.closest(".mod").toggleClass("open");
    });
    $("body").on("click", ".mod-toolbar .btn, .mod-toolbar .checkbox-right", function(e){
        e.stopPropagation();
    })
});