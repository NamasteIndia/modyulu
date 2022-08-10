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
            length = mods.length,
            arr = [];
        mods.each(function(indx, mod){
            let id = $(mod).data("mod");
            let index = length - indx - 1;
            arr.push({id: id, numsort: index});
        });
        $.ajax({
            method: "PUT",
            url: `/${dashboard}/post/${curPostType}/mod/numsort`,
            data: {data: JSON.stringify(arr)},
            success: function(rs){
                if(rs.code===0){
                    return false;
                }
            },
            error: function(error){
                swal.fire({
                    icon: 'error',
                    title: error.responseJSON.message,
                    showConfirmButton: true
                })
            }
        })
    }
    // Khai bao MOD co event DRAG & DROP
    $(".modlinkSortable").sortable({
        placeholder: "ui-state-highlight"
    });
    //$(".modlinkSortable").disableSelection();
    // Phat sinh su kien DROP MOD Link
    $(".modlinkSortable").droppable({
        drop: function( event, ui ) {
            setTimeout(submitSortModlink, 100);
        }
    });
    // Submit change numsort of MOD link
    function submitSortModlink(){
        var links = $(".modlinkSortable .mod-link"),
            length = links.length,
            arr = [];
        links.each(function(indx, link){
            let id = $(link).data("modlink");
            let index = length - indx - 1;
            arr.push({id: id, numsort: index});
        });
        $.ajax({
            method: "PUT",
            url: `/${dashboard}/post/${curPostType}/modlink/numsort`,
            data: {data: JSON.stringify(arr)},
            success: function(rs){
                if(rs.code===0){
                    return false;
                }
            },
            error: function(error){
                swal.fire({
                    icon: 'error',
                    title: error.responseJSON.message,
                    showConfirmButton: true
                })
            }
        })
    }
    // thêm link tải cho mod
    $('.mod-box').on("click", ".btn-add-modlink", function(e) {
        e.preventDefault();
        var mod = $(this).closest(".mod").attr("data-mod");
        var $modal = $('#modlinkModal');
        var $form = $modal.find(".modlink-form");
        var numlink = $(this).closest(".mod").find(".mod-link").length;
        $form.attr("action", $form.attr("action").replace("edit", "add"));        
        $form.trigger("reset");
        $form.find("input[name='modid']").val(mod);
        $form.find('input[name="numsort"]').val(numlink);
        $modal.modal('show');
    });
    // thêm mod cho post
    $('.mod-box').on("click", ".btn-add-mod", function(e) {
        e.preventDefault();
        var $modal = $('#modModal');
        var $form = $modal.find(".mod-form");
        var apk = $(this).closest('.mod-box').attr("data-apk");
        var numsort = $(this).closest('.mod-box').find(".mod").length || 0;
        $modal.find("#modModalLabel").text("Add Mod");
        $form.attr("action", $form.attr("action").replace("edit", "add"));
        $form.trigger("reset");
        $form.find("input[name='apkid']").val(apk);
        $form.find("input[name='numsort']").val(numsort);
        $modal.modal('show');
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
                var $modlink = $(this).closest('.mod-link');
                var modlink = $modlink.attr('data-modlink');
                $.ajax({
                    type: "POST",
                    url: `/${dashboard}/post/${curPostType}/modlink/delete`,
                    data: `id=${modlink}`,
                    success: function(data) {
                        var icon = 'warning';
                        if (data.code == 1) {
                            icon = 'success';
                            $modlink.remove();
                        }
                        swal.fire({
                            icon: icon,
                            title: data.message,
                            showConfirmButton: true
                        });
                    },
                    error: function(error){
                        swal.fire({
                            icon: 'error',
                            title: error.responseJSON.message,
                            showConfirmButton: true
                        })
                    }
                });
            }
        });
    });
    // xóa mod của post
    $('.mod-box').on("click", ".btn-del-mod", function(e) {
        e.preventDefault();
        var $mod = $(this).closest(".mod");
        swal.fire({
            icon: 'warning',
            title: 'Are you sure?',
            text: "Delete a mod",
            showCancelButton: true,
            cancelButtonText: 'Cancel',
            confirmButtonText: 'Ok'
        }).then((result) => {
            if (result.value) {
                var mod = $(this).closest(".mod").attr("data-mod");
                $.ajax({
                    type: "POST",
                    url: `/${dashboard}/post/${curPostType}/mod/delete`,
                    data: `id=${mod}`,
                    success: function(data) {
                        var icon = 'warning';
                        if (data.code == 1) {
                            icon = 'success';
                            $mod.remove();
                        }
                        swal.fire({
                            icon: icon,
                            title: data.message,
                            showConfirmButton: true
                        });
                    },
                    error: function(error){
                        swal.fire({
                            icon: 'error',
                            title: error.responseJSON.message,
                            showConfirmButton: true
                        })
                    }
                });
            }
        });
    });    
    // sửa mod của post
    $('.mod-box').on("click", ".btn-edit-mod", function(e) {
        e.preventDefault();
        // Bo khong dung - Do da dung auto save khi input
        /* var $modal = $('#modModal');
        var $form = $modal.find(".mod-form");
        var $mod = $(this).closest(".mod");
        var mod = $mod.attr("data-mod"),
            apk = $mod.closest(".mod-box").attr("data-apk"),
            title = $mod.find("input.modtitle").val(),
            description = $mod.find("textarea.moddescription").val(),
            showinsingle = $mod.find("input.showinsingle").prop("checked");
        $modal.find("#modModalLabel").text("Edit Mod");
        $form.attr("action", $form.attr("action").replace("add", "edit"));
        $form.find("input[name='id']").val(mod);
        $form.find("input[name='apkid']").val(apk);
        $form.find("input[name='title']").val(title);
        $form.find("textarea[name='description']").val(description);
        $form.find("input[name='showinsingle']").prop("checked", showinsingle);
        $modal.modal('show'); */
    });
    // submit form thêm và sửa mod của post
    $(".mod-form").submit(function(e) {
        e.preventDefault();
        var url = $(this).attr("action");
        var action = (url.includes("add")) ? "add" : "edit";
        $.ajax({
            type: "POST",
            url: url,
            data: $(this).serialize(),
            success: function(rs) {
                var icon = 'warning';
                if (rs.code == 1) {
                    icon = 'success';
                    var moddata = rs.data;
                    if (action == "edit") {
                        var $mod = $('.mod-box').find(`#mod-${moddata.id}`);
                        $mod.find('.modtitle').val(moddata.title);
                        $mod.find('.showinsingle').prop("checked", moddata.showinsingle);
                        $mod.find('.moddescription').val(moddata.description);
                        $mod.find('.mod-name-title').text(moddata.title);
                    }
                    if (action == "add") {
                        var boxModId = `mod-${moddata.id}`;
                        $(".mod-box #modSortable").prepend(`<div class="mod ui-state-default open mb-3" id="${boxModId}" data-mod="${moddata.id}">
                                                            <div class="mod-toolbar">
                                                                <button class="btn btn-danger btn-sm btn-del-mod rounded-0" title="Remove this mod"><i class="fas fa-times"></i></button>
                                                                <!--
                                                                <button class="btn btn-warning btn-sm btn-edit-mod rounded-0" title="Edit this link"><i class="fas fa-edit"></i></button>
                                                                -->
                                                                <button class="btn btn-primary btn-sm btn-add-modlink rounded-0" title="Add link"><i class="fas fa-plus"></i></button>
                                                                <span class="mod-name-title">${moddata.title}</span>
                                                                <div class="checkbox-right">
                                                                    <input class="showinsingle mod-change-item" type="checkbox" ${(moddata.showinsingle == true) ? 'checked': ''}>
                                                                    <label for="showinsingle">Hiển thị Mod ra trang single</label>
                                                                </div>
                                                            </div>
                                                            <div class="mod-body card rounded-0">
                                                                <div class="form-group">
                                                                    <label for="">Mod name</label>
                                                                    <input class="form-control modnumsort" type="hidden" value="${moddata.numsort}">
                                                                    <input class="form-control modtitle mod-input-item" type="text" placeholder="Mod name" value="${moddata.title}">
                                                                </div>
                                                                <div class="form-group">
                                                                    <label for="">Description</label>
                                                                    <textarea class="form-control modtinymce moddescription mod-change-item" placeholder="Description" spellcheck="false">${moddata.description}</textarea>
                                                                </div>
                                                                <div class="mod-link-holder"></div>
                                                            </div>
                                                            <div class="mod-footer"></div>
                                                        </div>`);
                    }
                    $("#modSortable").sortable('refresh');
                    tinyInitOption.selector = `#${boxModId} .modtinymce`;
                    tinymce.init(tinyInitOption);
                }
                $('#modModal').modal('hide');
                swal.fire({
                    icon: icon,
                    title: rs.message,
                    showConfirmButton: true
                });
            },
            error: function(error){
                swal.fire({
                    icon: 'error',
                    title: error.responseJSON.message,
                    showConfirmButton: true
                })
            }
        });
    });
    // submit form thêm và sửa link của mod
    $(".modlink-form").submit(function(e) {
        e.preventDefault();
        var url = $(this).attr("action");
        var action = (url.includes("add")) ? "add" : "edit";
        $.ajax({
            type: "POST",
            url: url,
            data: $(this).serialize(),
            success: function(rs) {
                var icon = 'warning';
                if (rs.code == 1) {
                    icon = 'success';
                    var datamodlink = rs.data;
                    if (action == "edit") {
                        var $mod = $('.mod-box').find(`#modlink-${datamodlink.id}`);
                        $mod.find('.linktitle').val(datamodlink.title);
                        $mod.find('.linksize').val(datamodlink.size);
                        $mod.find('.linklink').val(datamodlink.link);
                    }
                    if (action == "add") {
                        $(`#mod-${datamodlink.modid} .mod-link-holder`).prepend(`<div class="mod-link ui-state-default mb-3" id="modlink-${datamodlink.id}" data-modlink="${datamodlink.id}">
                                                            <div class="mod-link-toolbar text-right">
                                                                <button class="btn btn-danger btn-sm btn-del-modlink rounded-0" title="Remove this link"><i class="fas fa-times"></i></button>
                                                            </div>
                                                            <div class="mod-link-body card p-3 rounded-0">
                                                                <div class="row">
                                                                    <div class="col">
                                                                        <div class="form-group">
                                                                            <label for="">Name</label>
                                                                            <input class="form-control linktitle" type="text" placeholder="Name" value="${datamodlink.title}" required="">
                                                                        </div>
                                                                    </div>
                                                                    <div class="col">
                                                                        <div class="form-group">
                                                                            <label for="">Size</label>
                                                                            <input class="form-control linksize" type="text" placeholder="Size" value="${datamodlink.size}">
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div class="form-group">
                                                                    <label for="">Link</label>
                                                                    <input class="form-control linklink" type="text" placeholder="Link" value="${datamodlink.link}">
                                                                </div>
                                                            </div>
                                                        </div>`);
                    }
					$(".modlinkSortable").sortable('refresh');
				}
                $('#modlinkModal').modal('hide');
                swal.fire({
                    icon: icon,
                    title: rs.message,
                    showConfirmButton: true
                });
            },
            error: function(error){
                swal.fire({
                    icon: 'error',
                    title: error.responseJSON.message,
                    showConfirmButton: true
                })
            }
        });
    });
    // Open mod box
    $("body").on("click", ".mod .mod-toolbar", function(e){
        e.preventDefault();
        var $this = $(this);
        $this.closest(".mod").toggleClass("open");
        var id = $this.closest(".mod").data("mod");
        var tinyInitOptionNew = tinyInitOption;
        tinyInitOptionNew.selector = `#mod-${id} .modtinymce`;
        //tinymce.remove(`#mod-${id} .modtinymce`);
        tinymce.init(tinyInitOptionNew);
    });
    // Hủy event dom parent cua checkbox show in single page
    $("body").on("click", ".mod-toolbar .btn, .mod-toolbar .checkbox-right", function(e){
        e.stopPropagation();
    })
    // event thay doi noi dung mod -> auto save checkbox + editor
    $("body").on("click", ".mod .mod-change-item", function(e){
        autoSaveMod($(this))
    })
    // event thay doi noi dung mod -> auto save input text
    var timeSaveMod = 0;
    $("body").on("input", ".mod .mod-input-item", function(){
        clearTimeout(timeSaveMod);
        var $this = $(this);
        timeSaveMod = setTimeout(function(){
            autoSaveMod($this);
        }, 500)
    })
    // Thuc hien auto save mod
    function autoSaveMod($el){        
        var $modal = $('#modModal');
        var $form = $modal.find(".mod-form");
        var $mod = $el.closest(".mod");
        var mod = $mod.data("mod"),
            apk = $mod.closest(".mod-box").data("apk"),
            title = $mod.find("input.modtitle").val(),
            description = $mod.find("textarea.moddescription").val(),
            showinsingle = $mod.find("input.showinsingle").prop("checked");
        var url = $form.attr("action");
        url = url.replace(/add$/g, "edit");
        var data = {
            id: mod,
            apkid: apk,
            title: title,
            description: description,
            showinsingle: showinsingle
        }
        $.ajax({
            type: "POST",
            url: url,
            data: data,
            success: function(rs) {
                let textClass = (rs.code==1) ? "success" : "error";
                $mod.find(".mod-name-title").text(title);
                $mod.find(".mod-footer").html(`<div class="${textClass}">${rs.message}</div>`);
                setTimeout(function() {
                    $mod.find(".mod-footer div").remove();
                }, 3000);
            },
            error:function(error){
                $mod.find(".mod-footer").html(`<div class="error">${error.reponseJSON.message}</div>`);
                setTimeout(function() {
                    $mod.find(".mod-footer div").remove();
                }, 3000);
            }
        });
    }
    // Autho save modlink
    $('body').on("input", ".mod-link input", function(e){
        clearTimeout(timeSaveMod);
        var $this = $(this);
        timeSaveMod = setTimeout(function(){
            autoSaveModlink($this);
        }, 500)
    })
    // Thuc hien auto save mod
    function autoSaveModlink($el){
        var $mod = $el.closest(".mod");
        var $modlink = $el.closest(".mod-link");
        var id = $modlink.data("modlink"),
            title = $modlink.find(".linktitle").val(),
            linksize = $modlink.find(".linksize").val(),
            linklink = $modlink.find(".linklink").val();
        var url = `/${dashboard}/post/${curPostType}/modlink/edit`;
        var data = {
            id: id,
            title: title,
            link: linklink,
            size: linksize
        }
        $.ajax({
            type: "POST",
            url: url,
            data: data,
            success: function(rs) {
                let textClass = (rs.code==1) ? "success" : "error";
                $mod.find(".mod-name-title").text(title);
                $mod.find(".mod-footer").html(`<div class="${textClass}">${rs.message}</div>`);
                setTimeout(function() {
                    $mod.find(".mod-footer div").remove();
                }, 3000);
            },
            error:function(error){
                $mod.find(".mod-footer").html(`<div class="error">${error.reponseJSON.message}</div>`);
                setTimeout(function() {
                    $mod.find(".mod-footer div").remove();
                }, 3000);
            }
        });
    }
    // Thuc hien chuc nang releech app
    $("body").on("click", "#btn-releech", function(e){
        e.preventDefault();
        var $this = $(this);
        $this.prop("disabled", true);
        var playstore_url = $('#accordionMainPost input[name="apk[playstore_url]"]').val();
        var pid = $('#accordionMainPost input[name="id"]').val();
        swal.fire({
            icon: 'warning',
            title: 'Releech this APP',
            text: "This post will be updated",
            showCancelButton: true,
            cancelButtonText: 'Cancel',
            confirmButtonText: 'Ok'
        }).then((result) => {
            if (result.value) {                
                $.ajax({
                    type: "POST",
                    url: `/${dashboard}/post/post-apk/releech`,
                    data: {playstore_url: playstore_url, pid: pid},
                    success: function(rs) {
                        console.log(rs)
                        let icon = (rs.code==1) ? "success" : "error";
                        swal.fire({
                            icon: icon,
                            title: rs.message,
                            showConfirmButton: true
                        }).then(() => {                            
                            if(rs.code==1){
                                location.reload();
                            }else{
                                $this.prop("disabled", false);
                            }
                        })
                    },
                    error: function(error){
                        swal.fire({
                            icon: 'error',
                            title: (error.responseJSON) ? error.responseJSON.message : "Error",
                            showConfirmButton: true
                        }).then(() => {
                            $this.prop("disabled", false);
                        })
                    }
                });
            }
        })
    })
});