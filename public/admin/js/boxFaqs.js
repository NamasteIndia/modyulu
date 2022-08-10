(function ($) {
    $.fn.serializeFormJSON = function () {
        var o = {};
        var a = this.serializeArray();
        $.each(a, function () {
            if (o[this.name]) {
                if (!o[this.name].push) {
                    o[this.name] = [o[this.name]];
                }
                o[this.name].push(this.value || '');
            } else {
                o[this.name] = this.value || '';
            }
        });
        return o;
    };
})(jQuery);
$(document).ready(function(){
    // Hiển thị Popup Form
    $('.boxPopupAccordion').on("click", ".btn-show-popform", function(e) {
        e.preventDefault();
        var $box = $(this).closest(".boxPopupAccordion");
        var modalID = $box.data("popup");
        var $modal = $(`#${modalID}`);
        var $form = $modal.find("form");
        var numsort = $box.find(".bpaItem").length || 0;        
        $modal.find(".bpaModalLabel").text("Add");
        $form.attr("action", $form.attr("action").replace("edit", "add"));
        $form.trigger("reset");
        $form.find("input[name='numsort']").val(numsort);
        $modal.modal('show');
    });

    // Hiển thị chi tiết
    $("body").on("click", ".bpaItem .bpa-toolbar", function(e){
        e.preventDefault();
        if (e.target !== this)
            return;
        var $this = $(this);
        $this.closest(".bpaItem").toggleClass("open");
        var id = $this.closest(".bpaItem").data("id");
        var boxID = $this.closest(".boxPopupAccordion").attr("id");
        var selectorTextarea = `#${boxID}-${id} .bpatinymce`;
        var tinyInitOptionNew = tinyInitOption;
        tinyInitOptionNew.selector = selectorTextarea
        tinymce.remove(selectorTextarea);
        tinymce.init(tinyInitOptionNew);
    });

    // Sortable cho bpaItems
    $(".bpaSortable").sortable({
        placeholder: "ui-state-highlight",
        start: function( event, ui ) {
            var id=ui.item.attr("id");
            tinymce.remove(`#${id} .bpatinymce`);
        },
        stop: function( event, ui ) {
            var id=ui.item.attr("id");            
            tinyInitOption.selector = `#${id} .bpatinymce`;
            tinymce.init(tinyInitOption);
        }
    });

    // Sortable cho bpaItemBox
    $(".bpaSortable").droppable({
        drop: function( event, ui ) {            
            setTimeout(submitSortBPA(ui.draggable), 100);   
        }
    });

    // Submit change numsort of BPA
    function submitSortBPA(dom){        
        var $bpaBox = dom.closest(".bpaSortable"),
            bpaList = $bpaBox.find(".bpaItem")
            length = bpaList.length,
            link = $bpaBox.data("link"),
            arr = [];
        bpaList.each(function(indx, bpa){
            let id = $(bpa).data("id");
            let index = length - indx - 1;
            arr.push({id: id, numsort: index});
        });       
        $.ajax({
            method: "PUT",
            url: link,
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

    // Auto save
    var timeSaveBPA = 0;
    $(".bpaSortable").on("input", ".bpaItem .itemAutoSave", function(){
        clearTimeout(timeSaveBPA);        
        var $this = $(this);
        timeSaveBPA = setTimeout(function(){
            autoSaveBPA($this);
        }, 500);
    });

    $(".bpaSortable").on("click", ".bpaItem .bpa-change-item", function(e){
        autoSaveBPA($(this))
    })

    function autoSaveBPA($el){
        var $bpaItem = $el.closest(".bpaItem");
        var $htmlEdit = $bpaItem.find(".bpa-body");
        var $form = $("<form></form>");
        $form.html($htmlEdit.html());
        var url = $bpaItem.closest(".bpaSortable").data("link");
        url = url.replace(/numsort$/g, "edit");
        var data = $form.serializeFormJSON();
        data[`${$el.attr("name")}`] = $el.val();
        $.ajax({
            type: "POST",
            url: url,
            data: data,
            success: function(rs) {
                let textClass = (rs.code==1) ? "success" : "error";
                $bpaItem.find(".bpa-title").text(rs.data.title);
                $bpaItem.find(".bpa-footer").html(`<div class="${textClass}">${rs.message}</div>`);
                setTimeout(function() {
                    $bpaItem.find(".bpa-footer div").remove();
                }, 3000);
            },
            error:function(error){
                $bpaItem.find(".bpa-footer").html(`<div class="error">${error.reponseJSON.message}</div>`);
                setTimeout(function() {
                    $bpaItem.find(".bpa-footer div").remove();
                }, 3000);
            }
        });
    }

    // Add Faq
    $('.bpaModal').on("click", ".bpaSubmit", function(e) {
        e.preventDefault();
        var $modal = $(this).closest(".bpaModal");
        var $form = $modal.find("form");
        var $boxID = $modal.data("box");
        var $bpaBox = $(`#${$boxID}`);
        var url = $form.attr("action");
        //console.log($form.serializeFormJSON())
        $.ajax({
            type: "POST",
            url: url,
            data: $form.serializeFormJSON(),
            success: function(rs) {
                var icon = 'warning';                
                if (rs.code == 1) {
                    icon = 'success';
                    var data = rs.data;
                    var bpaItemId = `${$boxID}-${data.id}`;                     
                    $bpaBox.find(".bpaSortable").append(`<div class="bpaItem ui-state-default mb-3" id="${bpaItemId}" data-id="${data.id}">
                    <div class="bpa-toolbar">
                        <button class="btn btn-danger btn-sm rounded-0 btnDelBPA" title="Remove it"><i class="fas fa-times"></i></button>
                        <span class="bpa-title">${data.title}</span>
                    </div>
                    <div class="bpa-body card rounded-0">
                        <div class="form-group">
                            <label for="">Hỏi</label>
                            <input class="form-control" type="hidden" name="faqid" value="${data.id}">
                            <input class="form-control" type="hidden" name="faqpid" value="${data.postid}">
                            <input class="form-control" type="hidden" name="faqlangid" value="${data.langid}">
                            <input class="form-control" type="hidden" name="faqnumsort" value="${data.numsort}">
                            <input class="form-control itemAutoSave bpai-title" type="text" name="faqtitle" placeholder="Hỏi" value="${data.title}">
                        </div>
                        <div class="form-group">
                            <label for="">Trả lời</label>
                            <textarea class="form-control bpatinymce itemAutoSave bpa-change-item bpai-content" name="faqcontent" placeholder="Trả lời">${data.content}</textarea>
                        </div>
                    </div>
                    <div class="bpa-footer"></div>
                    </div>`);
                    $bpaBox.find(".bpaSortable").sortable('refresh');
                    tinyInitOption.selector = `#${$boxID} .bpatinymce`;
                    tinymce.init(tinyInitOption);
                }
                $modal.modal('hide');
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

    // Del Faq
    $('.bpaSortable').on("click", ".btnDelBPA", function(e) {
        e.preventDefault();
        var $bpaItem = $(this).closest(".bpaItem");
        var url = $bpaItem.closest(".bpaSortable").data("link");
        url = url.replace(/numsort$/g, "delete");
        swal.fire({
            icon: 'warning',
            title: 'Are you sure?',
            text: "You can't retrieve it again",
            showCancelButton: true,
            cancelButtonText: 'Cancel',
            confirmButtonText: 'Ok'
        }).then((result) => {
            if (result.value) {
                var id = $bpaItem.data("id");
                $.ajax({
                    type: "POST",
                    url: url,
                    data: `id=${id}`,
                    success: function(data) {
                        var icon = 'warning';
                        if (data.code == 1) {
                            icon = 'success';
                            $bpaItem.remove();
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
});