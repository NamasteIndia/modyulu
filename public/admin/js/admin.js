$(function() {
    // resize textarea
    $('body').on('change keyup keydown paste cut', 'textarea', function() {
        $(this).height(0).height((this.scrollHeight <= 50) ? 50 : this.scrollHeight);
    }).find('textarea').change();
    // make left menu
    var $siteMenu = $('#site-menu');
    if ($siteMenu.length > 0) {
        $('#site-menu').metisMenu();
    }
    // show / off left menu when click btn-menu on top nav
    $('.btn-show-site-menu, .over-body').click(function() {
        $('.page').toggleClass('show-menu');
    });
    // off loading page when page loaded
    $('.over-process').addClass('loaded');
    // change checkbox group effect
    $('body').on('click', '.checkbox', function() {
        var checkbox = $(this).children('input[type="checkbox"]');
        checkbox.prop("checked") ? checkbox.prop("checked", false) : checkbox.prop("checked", true);
        checkbox.trigger("change");
    });
    // submit form add in page
    $('.form-add-lang').submit(function(e) {
        e.preventDefault();
        var url = $(this).attr("action");
        var $form = $(this);
        $.ajax({
            type: "POST",
            url: url,
            data: $(this).serialize(),
            success: function(data) {
                var icon = (data.code == 1) ? 'success' : 'warning';
                swal.fire({
                    icon: icon,
                    title: data.message,
                    showConfirmButton: true
                });
                if (data.code == 1) {
                    url = url.replace("add", "edit");
                    $($form).toggleClass('form-add-lang').addClass('form-edit-page');
                    $($form).attr("action", url);
                    $($form).find(".form-group:first-child").append('<input type="hidden" name="id" value="' + data.data.id + '">');
                }
            },
            error: function(error){
                swal.fire({
                    icon: 'error',
                    text: error.responseJSON.message,
                    showConfirmButton: true
                })
            }
        });
    });
    // submit form edit in page
    $('.form-edit-page').submit(function(e) {
        e.preventDefault();
        var url = $(this).attr("action");
        $.ajax({
            type: "POST",
            url: url,
            data: $(this).serialize(),
            success: function(data) {
                var icon = (data.code == 1) ? 'success' : 'warning';
                swal.fire({
                    icon: icon,
                    title: data.message,
                    showConfirmButton: true
                });
            },
            error: function(error){
                swal.fire({
                    icon: 'error',
                    text: error.responseJSON.message,
                    showConfirmButton: true
                })
            }
        });
    });
    // delete item catelang
    $('.form-edit-page').on("click", ".btn-delete", function() {
        var id = $(this).attr("data-id");
        var type = $(this).attr("data-type");
        var $card = $(this).closest(".card");
        swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            showCancelButton: true,
            cancelButtonText: 'Cancel',
            confirmButtonText: 'Ok'
        }).then((result) => {
            if (result.value) {
                var url = `/${dashboard}/${type}/`;
                $.ajax({
                    type: "POST",
                    url: url,
                    data: `id=${id}`,
                    success: function(data) {
                        var icon = (data.code == 1) ? 'success' : 'warning';
                        swal.fire({
                            icon: icon,
                            title: data.message,
                            showConfirmButton: true
                        });
                        if (data.code == 1) {
                            $card.remove();
                        }
                    },
                    error: function(error){
                        swal.fire({
                            icon: 'error',
                            text: error.responseJSON.message,
                            showConfirmButton: true
                        })
                    }
                });
            }
        });
    });   
    // remove post lang
    $('body').on("click", ".lang-controls .btn-action-remove", function(e) {
        e.preventDefault();
        swal.fire({
            icon: "warning",
            title: 'Delete this language of post?',
            text: "You won't be able to revert this!",
            showCancelButton: true,
            cancelButtonText: 'Cancel',
            confirmButtonText: 'Ok'
        }).then((result) => {
            if (result.value) {
                var $this = $(this),
                    url = $this.attr("href");
                $.ajax({
                    url: url,
                    type: 'DELETE',
                    success: function(rs) {
                        var icon = 'warning';
                        if (rs.code == 1) {
                            icon = 'success';
                            $this.find(".fas").removeClass("fa-times").addClass("fa-plus");
                            $this.removeClass("btn-danger btn-action-remove").addClass("btn-outline-primary");
                            $this.closest("li").find(".btn-language").removeClass("btn-primary").addClass("btn-outline-primary");
                        }
                        swal.fire({
                            icon: icon,
                            title: rs.message,
                            showConfirmButton: true
                        });
                    },
                    error: function(error){
                        swal.fire({
                            icon: 'error',
                            text: error.responseJSON.message,
                            showConfirmButton: true
                        })
                    }
                });
            }
        });
    });
    // form redirect submit
    $('body').on("submit", ".form-redirect", function(e) {
        e.preventDefault();
        var url = $(this).attr("action");
        $.ajax({
            type: "POST",
            url: url,
            data: $(this).serialize(),
            success: function(rs) {
                var icon = (rs.code == 1) ? "success" : "warning";
                swal.fire({
                    icon: icon,
                    title: rs.message,
                    showConfirmButton: true
                }).then(() => {
                    if (rs.code == 1)
                        window.location.href = rs.redirect;
                });
            },
            error: function(error){
                swal.fire({
                    icon: 'error',
                    text: error.responseJSON.message,
                    showConfirmButton: true
                })
            }
        });
    });
    // create slug when change title
    $('body').on("keyup", "input.create-slug", function(e) {
        $(this).closest("form").find("input.appear-slug").val(convert_slug($(this).val()));
    });
    // Load data for seo progress bar when text change
    $('body').on("keyup", ".seo-progress-bar .seo-progress-text", function(e) {
        setSeoProgress($(this));
    });
    // Load data for seo progress bar when page load
    $.each($('.seo-progress-bar .seo-progress-text'), function(indx, el) {
        setSeoProgress($(el));
    });
    // Load current Menu
    var pageurl = window.location.href;
    pageurl = pageurl.replace(new RegExp(`^${domain}`, "g"), "");
    $.each($("#site-menu a"), function(index, a){       
        var href = $(a).attr("href").trim();        
        if(href === pageurl){
            $(a).closest("li").addClass("mm-active");
            $(a).closest(".sub-menu").addClass("mm-show");
            $(a).closest(".sub-menu").closest("li").addClass("mm-active");
        }
    });

    // Site Option checkbox change
    $(".site-option-checkbox").change(function(){
        var $this = $(this),
            val = $this.prop("checked") || false;
        $this.closest(".checkbox").find('input.metavalue').val(val);
    });

    // select2 init
    var $sl2 = $(".select2");
    if($sl2.length > 0){
        $(".select2").select2();
    }

    var $slCateAjax = $(".select2CateAjax");
    if($slCateAjax.length > 0 ){
        $.each($slCateAjax, function(i, sl){
            var tid = $(sl).data("type"),
                tname = $(sl).data("slname"),
                url = `/${dashboard}/category/${tid}/select2`;
            $($(sl)).select2({
                ajax: {
                    dataType: 'json',
                    url: url,
                    processResults: function (data, params) {
                        var results = $.map(data, function (obj) {
                            obj.text = obj.text || obj.title;
                            return obj;
                        });
                        return {
                            results: results,
                            pagination: {
                                more: false
                            }
                        };
                    },                    
                    delay: 500
                },
                placeholder: `Select ${tname}`,
                allowClear: true
            })
        })
    }

    // Date form change
    // Open date picker
    $("#btn-timepublic, #btn-tpf-cancel").click(function() {
        $(this).closest("#timepublicform").toggleClass("changing");
    });
    // Load Date when page load
    if ($("#btn-timepublic").length > 0) {
        var $frmTime = $("#timepublicform");
        var curDate = new Date($frmTime.find("input.maindatefield").val());
        var d = (isFinite(curDate)) ? curDate : new Date();
        var day = d.getDate();
        day = (parseInt(day) < 10) ? "0" + day : day;
        var month = d.getMonth() + 1;
        month = (parseInt(month) < 10) ? "0" + month : month;
        var year = d.getFullYear();
        year = (parseInt(year) < 10) ? "0" + year : year;
        var hour = d.getHours();
        hour = (parseInt(hour) < 10) ? "0" + hour : hour;
        var minute = d.getMinutes();
        minute = (parseInt(minute) < 10) ? "0" + minute : minute;        
        $frmTime.find("input[name='tpf-day']").val(d.getDate());
        $frmTime.find("select[name='tpf-month']").val(d.getMonth() + 1);
        $frmTime.find("input[name='tpf-year']").val(d.getFullYear());
        $frmTime.find("input[name='tpf-hour']").val(d.getHours());
        $frmTime.find("input[name='tpf-minute']").val(d.getMinutes());
        $frmTime.find("input.maindatefield").val(d);
        var curdate = new Date();
        if (curdate - d < 0) {
            var txt = "Public lúc <strong>".concat(hour,":",minute," ", day,"/",month,"/",year,"</strong>");
            $frmTime.find("#timepublic").html(txt);
        } else {
            $frmTime.find("#timepublic").html("Public <strong>ngay<strong>");
        }
    }
    // Change date apply
    $("#btn-tpf-apply").click(function() {
        var $frmTime = $(this).closest("#timepublicform");
        var day = parseInt($frmTime.find("input[name='tpf-day']").val());
        var month = parseInt($frmTime.find("select[name='tpf-month']").val());        
        var year = parseInt($frmTime.find("input[name='tpf-year']").val());
        var hour = parseInt($frmTime.find("input[name='tpf-hour']").val());
        var minute = parseInt($frmTime.find("input[name='tpf-minute']").val());
        var curdate = new Date(),
            pubdate = new Date(year, (month - 1), day, hour, minute, 0, 0);
        day = (day < 10) ? "0" + day : day;
        month = (month < 10) ? "0" + month : month;
        year = (year < 10) ? "0" + year : year;
        hour = (hour < 10) ? "0" + hour : hour;
        minute = (minute < 10) ? "0" + minute : minute;
        var dtf = ''.concat(year,"-",month,"-",day,"T",hour,":",minute,":00");
        if (!isFinite(new Date(dtf))) {
            $(this).closest("#timepublicwrap").addClass("error");
        } else {
            $(this).closest("#timepublicwrap").removeClass("error");
            if (curdate - pubdate < 0) {                
                var txt = "Public lúc <strong>".concat(hour,":",minute," ", day,"/",month,"/",year,"</strong>");
                $frmTime.find("#timepublic").html(txt);
            } else {
                $frmTime.find("#timepublic").html("Public <strong>ngay<strong>");
            }
            $frmTime.removeClass("changing");
            $frmTime.find("input.maindatefield").val(pubdate);
        }
    });
    // Form add post sumbit
    $("#post-form").submit(function(e) {
        e.preventDefault();
        var url = $(this).attr("action");
        $.ajax({
            type: "POST",
            url: url,
            data: $(this).serialize(),
            success: function(data) {
                if (data.code == 0) {
                    swal.fire({
                        icon: 'warning',
                        title: data.message,
                        showConfirmButton: true,
                        timer: 2000
                    });
                } else {
                    window.location.href = `${domain}/${dashboard}/post/${curPostType}/edit/${data.data.id}`;
                }
            },
            error: function(error){
                swal.fire({
                    icon: 'error',
                    text: error.responseJSON.message,
                    showConfirmButton: true
                })
            }
        });
    });
    // Submi Preview
    $("#post-form").on("click", "#btn-post-submit-preview", function(e){
        e.preventDefault();
        var $form = $(this).closest("#post-form");        
        var title = $form.find('input[name="title"]').val();
        if(title.length <= 0){
            swal.fire({
                icon: "warning",
                text: 'Chưa nhập tiêu đề bài viết',
                showCancelButton: true,
                cancelButtonText: 'Cancel',
                confirmButtonText: 'Ok'
            })
        }else{
            $form.find('select[name="poststatus"]').val('pendding');
            var url = $form.attr("action");
            $.ajax({
                type: "POST",
                url: url,
                data: $form.serialize(),
                success: function(data) {
                    if (data.code == 0) {
                        swal.fire({
                            icon: 'warning',
                            title: data.message,
                            showConfirmButton: true,
                            timer: 2000
                        });
                    } else {
                        window.location.href = `${domain}/?pid=${data.data.id}&preview=1`;
                    }
                },
                error: function(error){
                    swal.fire({
                        icon: 'error',
                        text: error.responseJSON.message,
                        showConfirmButton: true
                    })
                }
            });
        }
    });
    // Form edit post submit
    $("#post-form-edit").submit(function(e) {
        e.preventDefault();
        var url = $(this).attr("action");
        $.ajax({
            type: "POST",
            url: url,
            data: $(this).serialize(),
            success: function(data) {
                if (data.code == 0) {
                    swal.fire({
                        icon: 'warning',
                        title: data.message,
                        showConfirmButton: true
                    });
                } else {
                    swal.fire({
                        icon: 'success',
                        title: data.message,
                        showConfirmButton: true
                    }).then(() => {
                        location.reload();
                    });
                }
            },
            error: function(error){
                swal.fire({
                    icon: 'error',
                    text: error.responseJSON.message,
                    showConfirmButton: true
                })
            }
        });
    }); 
    // 
    $("#btn-submit-editmodified").click(function(e){
        e.preventDefault();
        var $this = $(this);
        swal.fire({
            icon: "warning",
            text: 'Cập nhật bài viết và hiển thị ra new update',
            showCancelButton: true,
            cancelButtonText: 'Cancel',
            confirmButtonText: 'Ok'
        }).then((result) => {
            if (result.value) {
                $this.closest("div").find("#modifiedat").val(new Date());
                $this.closest("#post-form-edit").submit();
            }
        })
    })   
    // tat notice auto update sai
    $(".noticeAutoUpdateVersionList").on("click", ".btn-remove-notice", function(e){
        e.preventDefault();        
        swal.fire({
            icon: "warning",
            title: 'You wanna turn off this notice?',
            showCancelButton: true,
            cancelButtonText: 'Cancel',
            confirmButtonText: 'Ok'
        }).then((result) => {
            if (result.value) {
                var $this = $(this),
                    id = $this.data("id");
                $.ajax({
                    url: `/${dashboard}/logapkfile/offnotice/${id}`,
                    method: "PUT",
                    success: function(rs){
                        icon = "warning";
                        if(rs.code==1){
                            icon = "success";
                            $this.closest(".item").remove();
                        }
                        swal.fire({
                            icon: icon,
                            text: rs.message,
                            showConfirmButton: true,
                            timer: 2000
                        })
                    },
                    error: function(error){
                        swal.fire({
                            icon: 'error',
                            text: error.responseJSON.message,
                            showConfirmButton: true
                        })
                    }
                })
            }
        })
    })
    $(window).on('scroll', function() {
        stickSidebar();
    });
    function stickSidebar(){
        try{
            var $sidebar = $(".stick-when-scroll");
            var paddingTop = 50,
                sbHeight = $sidebar.height(),
                sbTop = $sidebar[0].getBoundingClientRect().top,
                wHeight = window.innerHeight,
                wscrollTop = window.pageYOffset,
                isStick = (wHeight - paddingTop > sbHeight);
            if(isStick && window.innerWidth >= 992){
                if(wscrollTop > sbTop){
                    $sidebar.css({
                        top: paddingTop,
                        bottom: 'auto',
                        position: 'fixed',
                        width: $sidebar.width()
                    });
                }else{
                    $sidebar.css({
                        top: '0',
                        bottom: 'auto',
                        position: 'relative',
                        width: '100%'
                    });
                }
            }else{
                $sidebar.css({
                    top: '0',
                    bottom: 'auto',
                    position: 'relative',
                    width: '100%'
                });
            }
        }catch(err){}
    }
    // Tạo select2 ajax tìm post
    if($("#menu-posts").length > 0){
        $("#menu-posts").select2({
            placeholder: `Select post`,
            allowClear: true,
            ajax: {
                dataType: 'json',
                url: `/${dashboard}/menu/select2/post`,
                processResults: function (data, params) {
                    var results = $.map(data, function (obj) {
                        obj.text = obj.text || obj.title;
                        return obj;
                    });
                    return {
                        results: results,
                        pagination: {
                            more: false
                        }
                    };
                },                    
                delay: 500
            }                
        })
    }
    // Tạo select2 ajax tìm category
    if($("#menu-categories").length > 0){
        $("#menu-categories").select2({
            placeholder: "Select Category",
            allowClear: true,
            ajax: {
                dataType: 'json',
                url: `/${dashboard}/menu/select2/category`,
                processResults: function (data, params) {                    
                    var results = $.map(data, function (obj) {
                        obj.text = obj.text || obj.title;
                        return obj;
                    });
                    return {
                        results: results,
                        pagination: {
                            more: false
                        }
                    };
                },                    
                delay: 500
            }                
        })
    }
    // Tạo Select Apk choice    
    /* if($("#slApkChoice").length > 0){
        var sl2param = (langid) ? `?langid=${langid}` : "";
        var url = `/${dashboard}/apkchoice/sl2${sl2param}`;
        $("#slApkChoice").select2({
            placeholder: `Chọn Apk`,
            allowClear: true,
            ajax: {
                dataType: 'json',
                url: url,
                processResults: function (data, params) {
                    var results = $.map(data, function (obj) {
                        obj.text = obj.text || obj.title;
                        return obj;
                    });
                    return {
                        results: results,
                        pagination: {
                            more: false
                        }
                    };
                },
                delay: 500
            }
        })
    } */  
    if($("#slApkChoice").length > 0){
        var sl2param = (langid) ? `?langid=${langid}` : "";
        var url = `/${dashboard}/apkchoice/sl2${sl2param}`;        
        $('#slApkChoice').select2({
            placeholder: `Chọn Apk`,
            allowClear: true,
            ajax: {
                dataType: 'json',
                url: url,
                processResults: function (data, params) {
                    var results = $.map(data, function (obj) {
                        obj.text = obj.text || obj.title;
                        return obj;
                    });
                    return {
                        results: results,
                        pagination: {
                            more: false
                        }
                    };
                },
                delay: 500
            }
        }).on("select2:select", function (evt) {
            var id = evt.params.data.id;        
            var element = $(this).children("option[value="+id+"]");        
            moveElementToEndOfParent(element);        
            $(this).trigger("change");
        });
        var ele=$("#slApkChoice").parent().find("ul.select2-selection__rendered");
        ele.sortable({
            containment: 'parent',
            update: function() {
                orderSortedValues();
                //console.log(""+$("#slApkChoice").val())
            }
        });
        orderSortedValues = function() {            
            $("#slApkChoice").parent().find("ul.select2-selection__rendered").children("li[title]").each(function(i, obj){        
                var element = $("#slApkChoice").children('option').filter(function () { return $(this).html() == obj.title });
                moveElementToEndOfParent(element);
            });
        };
        moveElementToEndOfParent = function(element) {
            var parent = element.parent();        
            element.detach();        
            parent.append(element);
        };
    }
    $("#frmApkChoice").submit(function(e){
        e.preventDefault();
        var url = $(this).attr("action");
        var data = $(this).serialize();
        $.ajax({
            type: "POST",
            url: url,
            data: data,
            success: function(data) {
                swal.fire({
                    icon: (data.code==1) ? 'success' : 'warning',
                    title: data.message,
                    showConfirmButton: true
                });
            },
            error: function(error){
                swal.fire({
                    icon: 'error',
                    text: error.responseJSON.message,
                    showConfirmButton: true
                })
            }
        });
    });
});