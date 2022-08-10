// Bang moi nhat
var tinymceTimer = 0;
var $curImageEdit = null;
// Vị trí trỏ chuột của editor
var preCursorPosEditor = 0;
// Editor header style when scroll
$(window).on('scroll', function() {
    setStickyTinymce();
});
function setStickyTinymce() {
    var container = $("#collapseMainPost .tox-tinymce");
    var toolbars = container.find('.tox-editor-header');    
    if(!tinymce.activeEditor) return;
    if (isStickyTinyMCE()) {
        if (isAtBottomTinyMCE()) {            
            toolbars.css({transform: `translateY(-80px)`});
        } else {
            toolbars.css({
                top: '35px',
                bottom: 'auto',
                position: 'fixed',
                width: $(container).width(),
                borderBottom: '1px solid rgba(0,0,0,0.2)',
                transform: `translateY(0px)`
            });            
        }
    } else {
        toolbars.css({
            top: '0px',
            bottom: 'auto',
            position: 'absolute',
            width: $(container).width(),
            borderBottom: '1px solid rgba(0,0,0,0.2)',
            transform: `translateY(0px)`
        });
    }
}
function isStickyTinyMCE() {    
    try{
        var container = $("#collapseMainPost .tox-tinymce"),
            editorTop = container[0].getBoundingClientRect().top;
        if (editorTop < 0) {
            return true;
        }
        return false;
    }catch(err){
        return false;
    }
}
function isAtBottomTinyMCE() {
    try{
        var container = $("#collapseMainPost .tox-tinymce"),
            editorTop = container[0].getBoundingClientRect().top;
        var toolbarHeight = container.find('.tox-editor-header').outerHeight();
        var footerHeight = container.find('.tox-statusbar').outerHeight();
        var hiddenHeight = -(container.outerHeight() - toolbarHeight - footerHeight);        
        if (editorTop < hiddenHeight) {
            return true;
        }
        return false;
    }catch(err){
        return false;
    }
}
var tinyInitOption = {
    selector: '.tinymce',
    content_css: `${domain}/${dashboard}/assets/css/tnv-tinymce-style.css`,
    menubar: false, // off menu,
    statusbar: true,
    branding: false,
    object_resizing : false,
    keep_styles: false, // khong lap lai the tren
    contextmenu: 'link editimage delimage table',
    oninit: setPlainText, // remove format when paste
    plugins: 'paste autoresize autolink lists link pagebreak wordcount toc fullscreen charmap emoticons hr', //autoresize, code
    toolbar: 'formatselect | bold italic | numlist bullist | alignleft aligncenter alignright alignjustify | \
    blockquote link tnvimage tnvembed pagebreak | tnvcode fullscreen | \
    strikethrough forecolor hr removeformat charmap emoticons outdent indent undo redo',    
    setup: function(editor) {
        // Them menu item upload image tren toolbar
        editor.ui.registry.addButton('tnvimage', {
            icon: 'image',
            tooltip: 'Insert/edit image',
            onAction: function(_) {
                mmInit(true, true, "editor", true, this);
            }
        });
        // Them menu view source code tren toolbar
        editor.ui.registry.addButton('tnvcode', {
            icon: 'sourcecode',
            tooltip: 'View source code',
            onAction: function(_) {
                var textareaContentCodeSelected = editor.selection.getContent({format : 'html'});
                var textareaContentCode = editor.getContent({format : 'html'});
                sourcecodeInit(textareaContentCode, textareaContentCodeSelected);
            }
        });
        // Them menu item embed youtube video tren toolbar
        editor.ui.registry.addButton('tnvembed', {
            icon: 'embed',
            tooltip: 'Embde video youtube',
            onAction: function(_) {                
                embedYoutubeInit();
            }
        });
        // Them menu edit image trong menu context
        editor.ui.registry.addMenuItem('editimage', {
            icon: 'image',
            text: 'Image edit',
            onAction: function () {
                if($curImageEdit!==null){                    
                    var id = $curImageEdit.attr("id") || "";                    
                    id = parseInt(id.replace(/^smsci-/g, ""));
                    var cursize = $curImageEdit.find("img").attr("width") || "";
                    var curAlign = "left";
                    if($curImageEdit.attr("style") && $curImageEdit.attr("style").match(/margin-right/g)!=null){
                        curAlign = "center";
                    }
                    if($curImageEdit.attr("style") && $curImageEdit.attr("style").match(/float/g)!=null){
                        curAlign = "right";
                    }
                    if(Number(id)){
                        memInit(id, cursize, curAlign);
                    }else{
                        swal.fire({
                            icon: "error",
                            text: "Xin lỗi, hình ảnh này chuyển từ WP sang không thể sửa. Hãy thực hiện chèn lại",
                            showConfirmButton: true
                        }).then(() => {
                            $curImageEdit = null;
                        })
                    }
                }                
            }
        });
        editor.ui.registry.addContextMenu('editimage', {
            update: function (element) {
                if(element.src){
                    $curImageEdit = $(element).closest(".sm-single-content-image");
                }          
                return !element.src ? '' : 'editimage';
            }
        });
        // Them menu delete image trong menu context
        editor.ui.registry.addMenuItem('delimage', {
            icon: 'close',
            text: 'Remove image',
            onAction: function () {
                swal.fire({
                    icon: "question",
                    text: 'This image will be removed from the post',
                    showCancelButton: true,
                    cancelButtonText: 'Cancel',
                    confirmButtonText: 'Ok'
                }).then(rs => {
                    if(rs.value){
                        if($curImageEdit!==null){
                            $curImageEdit.remove();
                            tinyMCE.activeEditor.focus();
                        }
                    }
                })
            }
        });
        editor.ui.registry.addContextMenu('delimage', {
            update: function (element) {
                if(element.src){
                    $curImageEdit = $(element).closest(".sm-single-content-image");
                    $curImageEdit = ($curImageEdit.length==0) ? $(element) : $curImageEdit;
                }          
                return !element.src ? '' : 'delimage';
            }
        });
        // Phim tat Ctl+Alt+Z qua ve vi tri tro chuot
        editor.addShortcut('shift+alt+l', 'Align left', function () {
            editor.execCommand('JustifyLeft', false,'');
        });
        // Phim tat Ctl+Alt+Z qua ve vi tri tro chuot
        editor.addShortcut('shift+alt+c', 'Align center', function () {
            editor.execCommand('JustifyCenter', false,'');
        });
        // Phim tat Ctl+Alt+Z qua ve vi tri tro chuot
        editor.addShortcut('shift+alt+r', 'Align right', function () {
            editor.execCommand('JustifyRight', false,'');
        });
        // Phim tat Ctl+Alt+Z qua ve vi tri tro chuot
        editor.addShortcut('shift+alt+u', 'ul', function () {
            var slNodeName = editor.selection.getNode().nodeName;
            if(slNodeName.toLowerCase()=="ul"){
                editor.execCommand('RemoveList');
                $(window).scrollTop(preCursorPosEditor);
            }else if(slNodeName.toLowerCase()=="ol"){
                editor.execCommand('RemoveList');
                editor.execCommand('InsertOrderedList', false, {
                    'list-style-type': 'disc',
                });
                $(window).scrollTop(preCursorPosEditor);
            }else{
                editor.execCommand('InsertOrderedList', false, {
                    'list-style-type': 'disc',
                });
            }
            preCursorPosEditor = window.pageYOffset;
        });
        // Phim tat Ctl+Alt+Z qua ve vi tri tro chuot
        editor.addShortcut('shift+alt+o', 'ol', function () {
            var slNodeName = editor.selection.getNode().nodeName;
            if(slNodeName.toLowerCase()=="ol"){
                editor.execCommand('RemoveList');
                $(window).scrollTop(preCursorPosEditor);
            }else if(slNodeName.toLowerCase()=="ul"){
                editor.execCommand('RemoveList');
                editor.execCommand('InsertOrderedList', false, {
                    'list-style-type': 'decimal',
                });
                $(window).scrollTop(preCursorPosEditor);
            }else{
                editor.execCommand('InsertOrderedList', false, {
                    'list-style-type': 'decimal',
                });
            }
            preCursorPosEditor = window.pageYOffset;
        });
    },
    init_instance_callback: function (editor) {
        editor.on('focus', function (e) {
            // gan vi tri scroll page khi thuc hien dat con tro chuot vao mot vi tri bat ky trong editor
            preCursorPosEditor = window.pageYOffset;
        });
        editor.on('ExecCommand', function(e) {
            // scroll page den vi tri truoc khi thuc hien thay doi DOM editor
            $(window).scrollTop(preCursorPosEditor);
            // gan vi tri scroll page sau khi thuc hien thay doi DOM editor
            preCursorPosEditor = window.pageYOffset;        
        });
        editor.on('BeforeExecCommand', function(e) {
            // gan vi tri scroll page truoc khi thuc hien thay doi DOM editor
            preCursorPosEditor = window.pageYOffset;           
        });        
        // Auto save MOD khi co thay doi trong Editor - Cung chuc nang voi HAM thay doi text input
        editor.on("Change", function(e) {            
            clearTimeout(tinymceTimer);
            $this = $(this);
            tinymceTimer = setTimeout(function() {
                if($this.length > 0){
                    let $textarea = $($this[0].targetElm);
                    //if($textarea.hasClass("mod-change-item")){
                    if($textarea.hasClass("mod-change-item") || $textarea.hasClass("bpa-change-item")){
                        $($this[0].targetElm).html(editor.getContent());
                        $($this[0].targetElm).trigger("click");
                    }
                }
                //$('#collapseMainPost textarea[name="content"]').val(editor.getContent());
            }, 500);
        });
    },
    relative_urls: false,
    remove_script_host: false,
    convert_urls: true,
    powerpaste_word_import: 'clean',
    powerpaste_html_import: 'clean',
};
var editorLoadTimeOut;
tinymce.init(tinyInitOption);
window.addEventListener("load", function(){
    editorLoadTimeOut = setTimeout(loadEditor, 2000);
});
function loadEditor(){
    tinymce.init(tinyInitOption);
    clearTimeout(editorLoadTimeOut);
} 
// Xoa bo format HTML khi paste vao Editor
function setPlainText() {
    var ed = tinyMCE.get('elm1');
    ed.pasteAsPlainText = true;    
    //adding handlers crossbrowser
    if (tinymce.isOpera || /Firefox\/2/.test(navigator.userAgent)) {
        ed.onKeyDown.add(function(ed, e) {
            if (((tinymce.isMac ? e.metaKey : e.ctrlKey) && e.keyCode == 86) || (e.shiftKey && e.keyCode == 45))
                ed.pasteAsPlainText = true;
        });
    } else {
        ed.onPaste.addToTop(function(ed, e) {
            ed.pasteAsPlainText = true;
        });
    }
}
var fileMultiple = true,
    showSizes = true,
    fieldType = "thumbnail",
    isImage = false,
    $domHolder = undefined;
// chon image
$('body').on("click", ".mediaModal .attachment", function(e) {
    e.preventDefault();
    var $modal = $(this).closest(".mediaModal");
    if (!fileMultiple) {
        var hasclass = $(this).hasClass("selected");
        $modal.find(".attachment").removeClass("selected active");
        if (!hasclass) {
            $(this).addClass("selected active");
        }
    } else {
        $modal.find(".attachment").removeClass("active");
        $(this).addClass("selected active");
    }
    mmCreateDetail($(this));
    mmCountSelected($(this).closest('.mediaModal'));
});
// bo chon image
$('body').on("click", ".mediaModal .attachment button.check", function(e) {
    e.stopPropagation();
    $(this).closest(".attachment").removeClass("selected active");
    mmResetDetail($(this));
    mmCountSelected($(this).closest('.mediaModal'));
});
// clear all checked
$('body').on("click", ".mediaModal .btn-mm-clear", function(e) {
    e.preventDefault();
    mmClearSelected();
});
// hien thi nhung hinh da checked
$('body').on("click", ".mediaModal .btn-mmsh-selected", function(e) {
    $(this).closest(".mediaModal").toggleClass("show-selected");
    $(this).text(function(i, text) {
        return text === "Show selected" ? "Back media" : "Show selected";
    });
});
// tat modal media
$('body').on("click", ".mmModal .btn-close-mm, .mmModal .btn-mem-close, .mmModal .mm-backdrop", function(e) {
    e.preventDefault();
    $(this).closest(".mmModal").removeClass("show");
});
// tat modal media
$('body').on("click", ".mediaEditModal .btn-mem-change", function(e) {
    e.preventDefault();
    $(this).closest(".mediaEditModal").remove();
    mmInit(true, true, "editor", true, this);
});
// update media
$('body').on("submit", ".mediaModal .mmUpdateMedia", function(e) {
    e.preventDefault();
    $.ajax({
        url: `/${dashboard}/media/edit`,
        type: "POST",
        data: $(this).serialize(),
        success: function(rs) {},
        error: function(error){
            swal.fire({
                icon: "error",
                title: error.responseJSON.message,
                showConfirmButton: true
            })
        }
    });
});
// auto update media
let mediaTime = 0;
$('body').on('input', ".mediaModal .mmUpdateMedia .media-ap-item", function() {
    clearTimeout(mediaTime);
    $this = $(this);
    mediaTime = setTimeout(function() {
        $this.closest(".mmUpdateMedia").submit();
    }, 1000);
});
// delete media
$('body').on("click", ".mediaModal .img-info .btn-mm-delete", function(e) {
    e.preventDefault();
    swal.fire({
        icon: 'warning',
        title: 'Delete this file?',
        text: "You won't be able to revert this!",
        showCancelButton: true,
        cancelButtonText: 'Cancel',
        confirmButtonText: 'Ok'
    }).then((result) => {
        if (result.value) {
            var id = $(this).attr("data-id");
            var $attachment = $(this).closest(".mediaModal").find(`.mmcb-list li[data-id="${id}"]`);
            $.ajax({
                url: `/${dashboard}/media/delete/${id}`,
                type: "DELETE",
                success: function(rs) {                    
                    var icon = 'warning';
                    if(rs.code==1){
                        icon = 'success';
                        mmResetDetail($attachment);
                        $attachment.remove();
                    }                    
                    swal.fire({
                        icon: icon,
                        title: rs.message,
                        showConfirmButton: true
                    });
                },
                error: function(error){
                    swal.fire({
                        icon: "error",
                        title: error.responseJSON.message,
                        showConfirmButton: true
                    });
                }
            });
        }
    });
});
// filter media
$('body').on("click", ".mediaModal .mmc-header .btn-mm-filter", function(e) {
    e.preventDefault();
    mmLoadMedia($(this).closest(".mediaModal"));
});
// open new upload modal media
$('body').on("click", ".mediaModal .mmc-header .btn-mm-newupload", function(e) {
    e.preventDefault();
    var $ifile = $(this).closest(".mmc-header").find(".mmc-input-file");
    $ifile.prop("multiple", fileMultiple);
    $ifile.trigger("click");
});
// upload new files modal media
$('body').on("change", ".mediaModal .mmc-header .mmc-input-file", function(e) {
    e.preventDefault();
    var $modal = $(this).closest(".mediaModal");
    var files = $(this)[0].files;
    $.each(files, function(indx, file) {
        var fd = new FormData();
        fd.append('file', file);
        fd.append('type', fieldType);
        $.ajax({
            url: `/${dashboard}/media/single`,
            type: 'post',
            enctype: 'multipart/form-data',
            data: fd,
            cache: false,
            contentType: false,
            processData: false,
            success: function(rs) {                
                if (rs.code == 1) {
                    var lmedia = [];
                    lmedia.push(rs.data);
                    var html = mmLoadMediaDom(lmedia);
                    if (!fileMultiple) {
                        $modal.find('.mmcb-list .attachment').removeClass("selected active");
                        mmResetDetail($modal);
                    }
                    html = html.replaceAll(`class="attachment"`, `class="attachment selected"`);
                    $modal.find(".mmcb-list").prepend(html);
                    $modal.find('.mmcb-list .attachment').removeClass("selected active");
                    $modal.find(".mmcb-list").find(".attachment:first-child").addClass("selected");
                }
            },
            error: function(error){
                swal.fire({
                    icon: "error",
                    title: error.responseJSON.message,
                    showConfirmButton: true
                });
            }
        });
    });
});
// Apply modal media
$('body').on("click", ".mediaModal .btn-mm-aplly", function(e) {
    e.preventDefault();
    var $lis = $(this).closest(".mediaModal").find("li.selected"),
        $modal = $(this).closest(".mediaModal");
    switch (fieldType) {
        case 'thumbnail':
            var img = '',
                id = '',
                $holder = $($domHolder).closest(".mm-wrapper");
            $.each($lis, function(indx, li) {
                id = $(li).data("id");
                img = mmCreateUrlAttachment(li);
            });
            $holder.find('input[name=thumb]').val(id);
            $holder.find('.thumb').html(img);
            break;
        case 'icon':
            var img = '',
                id = '',
                $holder = $($domHolder).closest(".mm-wrapper");
            $.each($lis, function(indx, li) {
                id = $(li).data("id");
                img = mmCreateUrlAttachment(li);
            });
            $holder.find('input[name=imgicon]').val(id);
            $holder.find('.thumb').html(img);
            break;
        case 'editor':
            var imgText = '';
            $.each($lis, function(indx, li) {
                imgText += mmCreateUrlAttachment(li);
            });
            if($curImageEdit!=null){
                $curImageEdit.remove();
            }
            tinyMCE.activeEditor.execCommand("mceInsertContent", false, imgText + "<p></p>");
            break;
        case 'screenshoot':
            var rsText = '',
                id = '',
                url = '',
                type = '',
                $holder = $($domHolder).closest(".mm-wrapper");
            $.each($lis, function(indx, li) {
                id = $(li).attr("data-id");
                type = $(li).attr("data-type");
                url = $(li).find(".attachment-preview img").attr("src");
                if (type == 'image') {
                    rsText += `<div class="screenshoot">
                                <input type="hidden" name="screenshoot[]" value="${id}">
                                <img src="${url}"/>
                                <button class="btn btn-sm btn-danger rounded-0 btn-remove-screenshoot">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>`;
                }
            });
            $holder.find('.mm-ss-holder').append(rsText);
            break;
        default:
            console.log("None field declared");
            break;
    }
    mmClearSelected();
    $modal.removeClass("show");    
});
// choose image size modal media
$('body').on("change", ".mmUpdateMedia select[name='size']", function(e) {
    e.preventDefault();
    var id = $(this).closest(".mmUpdateMedia").find("input[name='id']").val();
    var $attachment = $(this).closest(".mediaModal").find(`.mmcb-list li[data-id="${id}"]`);
    $attachment.find(".attachment-preview img").attr("data-size", $(this).val());
});
// choose image align modal media
$('body').on("change", ".mmUpdateMedia select[name='align']", function(e) {
    e.preventDefault();
    var id = $(this).closest(".mmUpdateMedia").find("input[name='id']").val();
    var $attachment = $(this).closest(".mediaModal").find(`.mmcb-list li[data-id="${id}"]`);
    $attachment.find(".attachment-preview img").attr("data-align", $(this).val());
});
// choose change seotitle modal media
$('body').on("change", ".mmUpdateMedia textarea[name='seotitle']", function(e) {
    e.preventDefault();
    var id = $(this).closest(".mmUpdateMedia").find("input[name='id']").val();
    var $attachment = $(this).closest(".mediaModal").find(`.mmcb-list li[data-id="${id}"]`);
    $attachment.find(".attachment-preview img").attr("data-title", $(this).val());
});
// choose change alt modal media
$('body').on("change", ".mmUpdateMedia input[name='title']", function(e) {
    e.preventDefault();
    var id = $(this).closest(".mmUpdateMedia").find("input[name='id']").val();
    var $attachment = $(this).closest(".mediaModal").find(`.mmcb-list li[data-id="${id}"]`);
    $attachment.find(".attachment-preview img").attr("alt", $(this).val());
});
// choose change caption modal media
$('body').on("change", ".mmUpdateMedia textarea[name='description']", function(e) {
    e.preventDefault();
    var id = $(this).closest(".mmUpdateMedia").find("input[name='id']").val();
    var $attachment = $(this).closest(".mediaModal").find(`.mmcb-list li[data-id="${id}"]`);
    $attachment.find(".attachment-preview img").attr("data-caption", $(this).val());
});
// remove screenshoot
$('body').on("click", ".btn-remove-screenshoot", function(e) {
    e.preventDefault();
    $(this).closest(".screenshoot").remove();
})
// change title modal edit media
$('body').on("input", ".memForm .input-change-mm", function(){
    var $frm = $(this).closest(".memForm");
    var alt = $frm.find('input[name="title"]').val().trim(),
        title = $frm.find('input[name="seotitle"]').val().trim(),
        caption = $frm.find('textarea[name="description"]').val().trim() || "";
    var $img = $(this).closest(".memContent").find(".memImageView .sm-single-content-image");
    if(caption.length > 0){
        caption = `<figcaption class="caption">${caption}</figcaption>`;
    }
    $img.find(".caption") && $img.find(".caption").remove();
    $img.append(caption);
    if(alt.length > 0){
        $img.attr("alt", alt)
    }else{
        $img.removeAttr("alt")
    }
    if(title.length > 0){
        $img.attr("title", title)
    }else{
        $img.removeAttr("title")
    }
})
// change align modal edit media
$('body').on("change", '.memForm select[name="align"]', function(e){
    e.preventDefault();
    var align = $(this).val();
    var alignText = "";
    if(align=="center"){
        alignText = "display: block; margin-left: auto; margin-right: auto; text-align: center;";
    }
    if(align=="right"){
        alignText = "float: right; text-align: right;";
    }
    $(this).closest(".memContent").find(".memImageView .sm-single-content-image").attr("style", alignText);
})
// change size modal edit media
$('body').on("change", '.memForm select[name="size"]', function(e){
    e.preventDefault();
    try{
        var $frm = $(this).closest(".memForm");
        var cursize = $(this).val();
        var curalign = $frm.find('select[name="align"]').val();
        var json = $frm.serializeArray();
        $.map(json, function(n, i) {
            json[n['name']] = n['value'];
        });
        var imgText = mmRenderImageTag(json, cursize, curalign);
        $(this).closest(".memContent").find(".memImageView").html(imgText);
    }catch(err){
        swal.fire({
            icon: "error",
            title: "Cant change this image size",
            showConfirmButton: true
        })
    }
})
// Apply modal edit image
$('body').on("click", ".memForm .btn-mem-aplly", function(e){
    e.preventDefault();
    var $frm = $(this).closest(".memForm")
    var imgText = $(this).closest(".memContent").find(".memImageView").html();
    if($curImageEdit!==null){
        $.ajax({
            url: `/${dashboard}/media/edit`,
            type: "POST",
            data: $frm.serialize(),
            success: function(rs) {
                if(rs.code == 1){
                    $curImageEdit.remove();
                    tinyMCE.activeEditor.execCommand("mceInsertContent", false, imgText + "<p></p>");
                }else{
                    swal.fire({
                        icon: "error",
                        title: rs.code,
                        showConfirmButton: true
                    })
                }
            },
            error: function(error){
                swal.fire({
                    icon: "error",
                    title: (error.responseJSON.message) ? error.responseJSON.message : "Error",
                    showConfirmButton: true
                })
            }
        });        
    }else{
        swal.fire({
            icon: "error",
            title: "Please choose image update",
            showConfirmButton: true
        })
    }
    $(this).closest(".mediaEditModal").remove();
})
// Save change source code
$('body').on("click", ".sourceViewModal .btn-sourcecode-save", function(e){
    e.preventDefault();
    var content = scEditor.getValue();
    tinymce.activeEditor.setContent(content);
    $(this).closest(".sourceViewModal").removeClass("show");
})
// Apply embed youtube url
$('body').on("click", ".btn-embedytb-aplly", function(e){
    e.preventDefault();
    var url = $(this).closest(".embedYoutubeModal").find("#embedYoutubeUrl").val() || "";
    var arr = url.split("/");
    var id = (arr.length > 2) ? arr[arr.length-1] : "";
    if(id!=""){
        var noscript = `<noscript><iframe width="730" height="360" src="https://www.youtube.com/embed/${id}" style="border:0; overflow:hidden;" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></noscript>`;
        var html = `<p class="youtube" data-embed="${id}"><span class="play-button">&nbsp;</span></p><p>${noscript}</p><p></p>`;
        tinymce.activeEditor.execCommand("mceInsertContent", false, html);
        $(this).closest(".embedYoutubeModal").remove();
    }else{
        swal.fire({
            icon: "error",
            text: "Youtube embed url is wrong",
            showConfirmButton: true
        })
    }
})
// Diem so image dang chon
function mmCountSelected($modal) {
    var selected = $modal.find('.mmcb-list .attachment.selected').length;
    $modal.find(".mmcf-listchecked .label").text(`${selected} items selected`);
    $modal.find(".mmc-footer .btn-mm-aplly").prop("disabled", (selected > 0) ? false : true);
}
// Load chi tiet anh dang chon
function mmCreateDetail($attachment) {
    var id = $attachment.attr("data-id"),
        ajaxUrl = `/${dashboard}/media/info/${id}`;
    $.ajax({
        type: "GET",
        url: ajaxUrl,
        success: function(rs) {
            if (rs.code == 1) {
                var curSize = $attachment.find(".attachment-preview img").attr("data-size");
                $attachment.closest(".mediaModal").find(".mmcb-detail").html(mmCreateDetailDom(rs.data, curSize));
            }
        }
    });
}
// Xoa HTML chi tiet anh
function mmResetDetail($attachment) {
    $attachment.closest(".mediaModal").find(".mmcb-detail").html('');
}
// Bo chon tat ca anh dang chon
function mmClearSelected(){
    let $modal = $('.mediaModal');
    $modal.find('.mmcb-list .attachment').removeClass("selected active");
    mmCountSelected($modal);
    mmResetDetail($modal);
}
// Load HTML chi tiet anh dang chon
function mmCreateDetailDom(media, cursize) {
    var sizes = media.childsizes.split(",").map(item => item.split("x"));
    var htmlsizes = '';
    sizes.forEach(size => {
        htmlsizes += `<option value="${size[0]}" ${(size[0] == cursize) ? 'selected':''} >${size[0]}x${size[1]}</option>`;
    });
    var sizeText = ``;
    if (showSizes) {
        sizeText = `<div class="form-group">
                        <label for="size">Size</label>
                        <select name="size" class="form-control">
                            ${htmlsizes}
                        </select>
                    </div>`;
    }
    var html = `<div class="img-info">
                    <img src="${media.urlicon}" alt="${media.title}">
                    <p>${media.filename}</p>
                    <p>${formart_datetime(media.createdAt, "full")}</p>
                    <p>${media.imgwidth}x${media.imgheight} - ${media.filesize}</p>
                    <a class="btn btn-sm btn-outline-danger btn-mm-delete" data-id="${media.id}" href="javascript:void(0);">Delete</a>
                </div>
                <form action="/" class="mmUpdateMedia">
                    <div class="form-group">
                        <label for="note">Alt</label>
                        <input type="hidden" name="id" value="${media.id}">
                        <input type="text" class="form-control media-ap-item" name="title" placeholder="Alt" value="${(media.title==null)?"":media.title}">
                    </div>
                    <div class="form-group">
                        <label for="note">Title</label>
                        <textarea class="form-control media-ap-item" name="seotitle" placeholder="Title">${(media.seotitle==null)?"":media.seotitle}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="description">Caption</label>
                        <textarea class="form-control media-ap-item" name="description" placeholder="Caption">${(media.description==null)?"":media.description}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="url">Url</label>
                        <input type="text" class="form-control" name="url" placeholder="Url" value="${media.url}" disabled>
                    </div>
                    ${sizeText}
                    <div class="form-group">                                    
                        <select name="align" class="form-control">
                            <option value="left">Left</option>
                            <option value="center" selected>Center</option>
                            <option value="right">Right</option>
                        </select>
                    </div>
                </form>`;
    return html;
}
// Load danh sach anh vao modal Media
function mmLoadMedia($modal) {
    var month = $modal.find('.mmc-header select[name="slMonth"]').val(),
        search = $modal.find('.mmc-header input[name="txtSearch"]').val(),
        offset = $modal.find('.mmcb-list li.attachment').length,
        unlessids = [],
        ajaxUrl = `/${dashboard}/media/list`,
        $screenshoots = $($domHolder).closest(".mm-wrapper").find(".mm-ss-holder .screenshoot");
    if ($screenshoots.length > 0) {
        $.each($screenshoots, function(indx, screenshoot) {
            unlessids.push($(screenshoot).find("input[name='screenshoot[]']").val());
        });
    }
    $.ajax({
        type: "GET",
        url: ajaxUrl,
        data: {
            search: search,
            month: month,
            type: fieldType,
            unlessids: unlessids,
            offset: offset
        },
        success: function(rs) {
            if (rs.code == 1) {
                var html = mmLoadMediaDom(rs.data);
                $modal.find(".mmcb-list").html(html);
            }
        }
    });
}
// Load HTML danh sach anh vao modal Media
function mmLoadMediaDom(lmedia) {
    var dom = '';
    lmedia.forEach(media => {
        let sizes = [];
        if (media.childsizes.length > 0) {
            sizes = media.childsizes.split(",").map(item => parseInt(item.split("x")[0]));
        }
        url = media.urlicon;
        let filename = (media.filetype.startsWith("image")) ? '' : `<div class="filename">${media.filename}</div>`;
        dom += `<li class="attachment" data-id="${media.id}" data-type="${media.filetype.startsWith('image') ? 'image' : 'file'}">
                    <div class="attachment-preview">
                        <img src="${url}" alt="${media.title}" data-title="${media.seotitle}" data-caption="${media.description}" data-src="${media.urlicon}" data-max="${media.imgwidth}" data-size="${media.imgwidth}" data-sizes="${sizes.join(",")}">
                        ${filename}
                    </div>
                    <button type="button" class="btn check"><i class="fas fa-check"></i></button>
                </li>`;
    });
    return dom;
}
// Open modal Media
function mmInit(multiple, size, field, isimg, holder) {
    fileMultiple = multiple;
    showSizes = size;
    fieldType = field;
    isImage = isimg;
    $domHolder = holder;
    var $modal = $('body').find('.mediaModal');
    if ($modal.length > 0) {
        mmLoadMedia($modal);
        $modal.addClass("show");
    } else {
        $.ajax({
            url: `/${dashboard}/media/initmodal`,
            type: "GET",
            data: {
                isimg: isImage
            },
            success: function(rs) {
                if (rs.code == 1) {
                    mmCreateModal(rs.data);
                } else {
                    alert(rs.message);
                }
            }
        })
    }
}
// Open modal Edit Media
function memInit(attachmentId, curSize, curAlign){
    $.ajax({
        type: "GET",
        url: `/${dashboard}/media/info/${attachmentId}`,        
        success: function(rs) {
            if (rs.code == 1) {
                var img = rs.data;
                var size = curSize.replace(/px$/g,"");
                size = Number(size) || img.imgwidth;
                var imgTag = mmRenderImageTag(img, size, curAlign);
                var sizeArr = img.childsizes || "";
                sizeArr = sizeArr.split(",");
                var sizeDomArr = [];
                sizeArr.map(s => {
                    let widths = s.split("x");
                    let width = (widths.length > 1) ? widths[0] : 0;
                    sizeDomArr.push(`<option value="${width}" ${(width == size) ? "selected" : ""}>${s}</option>`)
                })
                var sizeDom = "";
                if(sizeDomArr.length > 0){
                    sizeDom = `<div class="form-group">
                                    <label class="td" for="size">Size</label>
                                    <select name="size" class="form-control td">${sizeDomArr.join("")}</select>
                                </div>`;
                }
                
                var html = `<div class="mmModal mediaEditModal show">
                    <div class="mm-wrapper">
                        <button type="button" class="btn btn-close-mm"><span>×</span></button>
                        <div class="mm-content">
                            <div class="mmc-header">
                                <h5 class="text-title">Edit Image</h5>
                            </div>
                            <div class="mmc-body">
                                <div class="memContent">
                                    <div class="row">
                                        <div class="col col-left">
                                            <form action="" class="memForm">
                                                <div class="form-group">
                                                    <label class="td" for="title">Alt</label>                                                    
                                                    <input value="${img.id}" type="hidden" name="id">
                                                    <input value="${img.note}" type="hidden" name="note">
                                                    <input value="${img.childsizes}" type="hidden" name="childsizes">
                                                    <input value="${img.imgwidth}" type="hidden" name="imgwidth">
                                                    <input value="${img.url}" type="hidden" name="url">
                                                    <input value="${img.urlicon}" type="hidden" name="urlicon">
                                                    <input value="${img.imgwidth}" type="hidden" name="imgwidth">
                                                    <input class="input-change-mm form-control td" value="${img.title}" type="text" name="title" placeholder="Alt">
                                                </div>
                                                <div class="form-group">
                                                    <label class="td" for="seotitle">Title</label>
                                                    <input class="input-change-mm form-control td" value="${img.seotitle}" type="text" name="seotitle" placeholder="Title">
                                                </div>
                                                <div class="form-group">
                                                    <label class="td" for="description">Caption</label>
                                                    <textarea class="input-change-mm form-control td" name="description" cols="30" rows="3" placeholder="Caption">${img.description}</textarea>
                                                </div>
                                                ${sizeDom}
                                                <div class="form-group">
                                                    <label class="td" for="align">Align</label>
                                                    <select name="align" class="form-control td">
                                                        <option value="left" ${(curAlign=="left")?"selected":""}>Left</option>
                                                        <option value="center" ${(curAlign=="center")?"selected":""}>Center</option>
                                                        <option value="right" ${(curAlign=="right")?"selected":""}>Right</option>
                                                    </select>
                                                </div>
                                                <div class="form-group">
                                                    <div class="td"></div>
                                                    <div class="td">
                                                        <button class="btn btn-primary btn-mem-aplly">Apply</button>
                                                        <button class="btn btn-outline-primary btn-mem-change">Other image</button>
                                                        <button class="btn btn-outline-danger btn-mem-close">Cancel</button>
                                                    </div>
                                                </div>
                                            </form>
                                        </div>
                                        <div class="col">
                                            <div class="memImageView">
                                                ${imgTag}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>            
                        </div>
                    </div>
                    <div class="mm-backdrop"></div>
                </div>`;
                $("body").append(html);
            }else{
                swal.fire({
                    icon: "error",
                    text: (rs.message) ? rs.message : "Error",
                    showConfirmButton: true
                }).then(() => {
                    $curImageEdit = null;
                    $(".mediaEditModal").remove();
                })
            }
        },
        error: function(error){
            swal.fire({
                icon: "error",
                text: (error.reponseJSON.message) ? error.reponseJSON.message : "Error",
                showConfirmButton: true
            }).then(() => {
                $curImageEdit = null;
                $(".mediaEditModal").remove();
            })
        }
    });
}
// Open modal Source Code
var scEditor;
function sourcecodeInit(textareaContentCode, textareaContentCodeSelected){
    var html = `<div class="mmModal sourceViewModal show">
                    <div class="mm-wrapper">
                        <button type="button" class="btn btn-close-mm"><span>×</span></button>
                        <div class="mm-content">
                            <div class="mmc-header">
                                <h5 class="text-title">Source code</h5>
                            </div>
                            <div class="mmc-body">
                                <textarea id="sourcecodeViewArea">${textareaContentCode}</textarea>
                            </div>
                            <div class="mmc-footer text-right">
                                <button class="btn btn-primary btn-sourcecode-save">Save</button>
                                <button class="btn btn-danger btn-mem-close">Cancel</button>
                            </div>           
                        </div>
                    </div>
                    <div class="mm-backdrop"></div>
                </div>`;
    if(scEditor==undefined){ 
        $("body").append(html);
    }else{
        document.getElementsByClassName("CodeMirror")[0].remove();
        document.getElementsByClassName("sourceViewModal")[0].classList.add("show");
        document.getElementById("sourcecodeViewArea").value = textareaContentCode;
    }
    var textareaMirror = document.getElementById("sourcecodeViewArea");
    scEditor = CodeMirror.fromTextArea(textareaMirror, {
        lineNumbers: true,
        lineWrapping:'true',
        mode: "htmlmixed",
        autofocus: true
    });
    var maxLineNum = scEditor.lineCount();
    for(let i = 1; i<=maxLineNum; i++){
        var lineText = scEditor.getLine(i);
        lineText = (lineText) ? lineText : "";
        if(textareaContentCodeSelected != "" && lineText.includes(textareaContentCodeSelected)){                     
            scEditor.focus();
            scEditor.setCursor({line: i, ch: 0});            
            scEditor.addLineClass(i, '', 'focused');
            i = maxLineNum;
        }
    }
}
// Open modal Edit Media
function embedYoutubeInit(){
    var html = `<div class="mmModal embedYoutubeModal show">
                    <div class="mm-wrapper">
                        <button type="button" class="btn btn-close-mm"><span>×</span></button>
                        <div class="mm-content">
                            <div class="mmc-header">
                                <h5 class="text-title">Embed Youtube Video</h5>
                            </div>
                            <div class="mmc-body">
                                <div class="embedYtbForm">
                                    <div class="form-group">
                                        <label class="td" for="title">Youtube embed URL</label>
                                        <input class="form-control td" id="embedYoutubeUrl" type="text" placeholder="https://www.youtube.com/embed/NZ2FKqtOTnw">
                                    </div>
                                    <div class="form-group">
                                        <div class="td"></div>
                                        <div class="td">
                                            <button class="btn btn-primary btn-embedytb-aplly">Apply</button>
                                            <button class="btn btn-outline-danger btn-mem-close">Cancel</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="mm-backdrop"></div>
                </div>`;
    $("body").append(html);
}
// Tao HTML anh add vao Editor
function mmRenderImageTag(imgObj, curSize, curAlign){
    var curAlignText = 'style=""';
    if(curAlign=="center"){
        curAlignText = 'style="display: block; margin-left: auto; margin-right: auto; text-align: center;"';
    }
    if(curAlign=="right"){
        curAlignText = 'style="float: right; text-align:right;"';
    }
    var sizesArr = imgObj.childsizes || "";
    sizesArr = sizesArr.split(",");
    var widthsArr = sizesArr.map(s => {
        let i = s.split("x");
        if(i.length > 1) return i[0];
    })
    var url = imgObj.urlicon;
    var urlmax = imgObj.url;
    var max = imgObj.imgwidth;
    var srcset = [];
    var sizes = [];
    widthsArr.forEach(s => {
        if (s <= curSize) {
            url = (s == max) ? urlmax : url.replace(/-150\./g, `-${s}.`);
            srcset.push(`${url} ${s}w`);
            sizes.push(`${s}px`)
        }
    });
    urlmax = (curSize == max) ? urlmax : url.replace(/-150\./g, `-${curSize}.`);
    /* var imgTag = `<figure id="smsci-${imgObj.id}" class="sm-single-content-image" ${curAlignText}>
                    <img 
                        title="${imgObj.description}" 
                        alt="${imgObj.title}" 
                        width="${curSize}" 
                        src="${urlmax}" 
                        srcset="${srcset.join(",")}" 
                        sizes="(max-width: ${curSize}px) ${sizes.join(",")}" decoding="async"/>
                    <figcaption class="caption">${imgObj.description}</figcaption>
                </figure>`; */
    var imgTag = `<figure id="smsci-${imgObj.id}" class="sm-single-content-image" ${curAlignText}>
                <img 
                    title="${imgObj.description}" 
                    alt="${imgObj.title}" 
                    width="${curSize}" 
                    src="${urlmax}" decoding="async"/>
                <figcaption class="caption">${imgObj.description}</figcaption>
            </figure>`;
    return imgTag.trim();
}
// Tao HTML modal Media
function mmCreateModal(data) {
    var month = '';
    data.months.forEach(m => {
        month += `<option value="${m.month}">${m.month}</option>`;
    });
    var html = `<div class="mmModal mediaModal show">
                    <div class="mm-wrapper">
                        <button type="button" class="btn btn-close-mm"><span>×</span></button>
                        <div class="mm-content">
                            <div class="mmc-header">
                                <select name="slMonth">
                                    <option value="%">All dates</option>
                                    ${month}                                                
                                </select>                                            
                                <input type="text" name="txtSearch" placeholder="Search">
                                <input type="file" name="file" class="mmc-input-file">
                                <button class="btn btn-primary btn-mm-filter">Filter</button>
                                <button class="btn btn-primary btn-mm-newupload">New upload</button>
                            </div>
                            <div class="mmc-body">
                                <div class="mmcb-detail">
                                </div>
                                <ul class="mmcb-list" data-count="${data.total}">
                                </ul>
                            </div>
                            <div class="mmc-footer">
                                <button class="btn btn-primary btn-mm-aplly" disabled>Apply</button>
                                <div class="mmcf-listchecked">
                                    <span class="label">0 items selected</span>
                                    <button class="btn btn-sm btn-outline-primary btn-mmsh-selected">Show selected</button>
                                    <button class="btn btn-sm btn-outline-danger btn-mm-clear">Clear</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="mm-backdrop"></div>
                </div>`;
    $("body").append(html);
    mmLoadMedia($('.mediaModal'));
}
// Tao url iamge responsive
function mmCreateUrlAttachment(attachment) {
    let type = $(attachment).data("type");
    let id = $(attachment).data("id");
    let $img = $(attachment).find(".attachment-preview img"),
        url = $img.data("src"),
        urlmax = url.replace(/-150/g, ""),
        title = $img.attr("alt"),
        max = $img.data("max"),
        size = $img.data("size"),
        sizes = $img.data("sizes").toString(),
        align = $img.data("align") || "center",
        textAlt = $img.attr("alt") || "",
        proAlt = (textAlt!=null && textAlt.length>0)?`alt="${textAlt}"`:"";
        textTitle = $img.data("title") || "",
        proTitle = (textTitle!=null && textTitle.length>0)?`title="${textTitle}"`:"";
        textCaption = $img.data("caption") || "",
        tagCaption = (textCaption!=null && textCaption.length>0)?`<figcaption class="caption">${textCaption}</figcaption>`:"";
        rs = '';
    switch (type) {
        case 'file':
            rs = `<a href="${url}" title="${title}">${url}</a>`;
            break;
        case 'image':
            let sizesArr = sizes.split(","),
                srcset = [],
                srcsetSizes = [],
                cssAlign = "";
            cssAlign = (align == "center") ? `style="display: block; margin-left: auto; margin-right: auto; text-align:center;"` : cssAlign;
            cssAlign = (align == "right") ? `style="float: right; text-align:right;"` : cssAlign;
            sizesArr.forEach(s => {
                if (s <= size) {
                    url = (s == max) ? urlmax : url.replace(/-150\./g, `-${s}.`);
                    srcset.push(`${url} ${s}w`);
                    srcsetSizes.push(`${s}px`);
                }
            });
            urlmax = (size == max) ? urlmax : url.replace(/-150\./g, `-${size}.`);
            rs = `<figure id="smsci-${id}" class="sm-single-content-image" ${cssAlign}>`;
            //rs += `<img ${proAlt} ${proTitle} srcset="${srcset.join()}" sizes="(max-width: ${size}px) ${srcsetSizes.join(",")}" src="${urlmax}" width="${size}" decoding="async"/>`;
            rs += `<img ${proAlt} ${proTitle} src="${urlmax}" width="${size}" decoding="async"/>`;
            rs += (tagCaption.length > 0) ? tagCaption : "";
            rs += "</figure>";
            break;
        default:
            console.log("wrong attachment type");
            break;
    }
    return rs.trim();
}