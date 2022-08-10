$(document).ready(function() {

    $(".box-dropdown").on("click", ".dd-toggle", function(e) {
        e.preventDefault();
        var $dropdown = $(this).closest(".box-dropdown");
        var add = ($dropdown.hasClass("open")) ? false : true;
        $(".box-dropdown").removeClass("open");
        if (add) $dropdown.addClass("open");
    });

    if($('.slideapk')){
        $('.slideapk').owlCarousel({
            loop: true,
            nav: true,
            responsive: {
                0: {
                    items: 1
                },
                768: {
                    items: 2,
                    margin: 5
                }
            }
        });
    }    

    $(".accordion").on("click", ".ahead", function(e) {
        var $accordion = $(this).closest('.accordion');
        $accordion.toggleClass('open');
        var headText = ($accordion.hasClass("open")) ? '−' : '+';
        $(this).find("span.toggle").text(headText);
    });

    $(".box-showless").on("click", ".bsl-toggle", function(e){
        e.preventDefault();
        $(this).closest('.box-showless').toggleClass('open');
        var text = $(this).data("text");
        $(this).data("text", $(this).text());
        $(this).text(text);
        var top = $(this).closest('.box-showless').offset().top;
        if(window.scrollY > top){
            window.scroll({
                top: top - 115,
                behavior: 'smooth'
            })
        }
    });

    $(".box-othermod").on("click", ".link-showmore", function(e){
        e.preventDefault();
        $(this).closest('.box-othermod').find('.item-hide').toggleClass('hidden');
        var text = $(this).data("text");
        $(this).data("text", $(this).text());
        $(this).text(text);
        var top = $(this).closest('.box-othermod').offset().top;
        if(window.scrollY > top){
            window.scroll({
                top: top - 115,
                behavior: 'smooth'
            })
        }
    });

    $(".box-faq").on("click", ".bfaq-head .item", function(e){
        e.preventDefault();
        var $this = $(this);
        var $items = $this.closest(".bfaq-head").find(".item");
        var pos = $items.index($this);
        pos = (pos >= 0) ? (pos+1) : 1;
        $items.removeClass("open");
        $this.addClass("open");
        var $fbBody = $this.closest(".box-faq").find(".bfaq-body");
        $fbBody.find(".item").removeClass("open");
        $fbBody.find(`.item:nth-child(${pos})`).addClass("open");
    });

    var ringtoneAudio = new Audio();
    $(".ringtones a.mp3").click(function(e){
        if($(this).hasClass("play")){
            e.preventDefault();
            var flag = $(this).hasClass("playing");
            $(this).closest(".ringtones").find("li .mp3").removeClass("playing");
            if (!flag) {
                $(this).addClass("playing");
                if (!ringtoneAudio.paused) {
                    ringtoneAudio.pause();
                    ringtoneAudio.currentTime = 0;
                }
                ringtoneAudio = new Audio($(this).attr("href"));
                ringtoneAudio.load();
                ringtoneAudio.loop = true;
                ringtoneAudio.play();
            } else {
                if (!ringtoneAudio.paused) {
                    ringtoneAudio.pause();
                    ringtoneAudio.currentTime = 0;
                }
            }
        }
    });

    $("#ringtonePopup .btn").click(function(e){
        e.preventDefault();
        var $this = $(this),
            id = $this.data("id"),
            $ringtone = $(`#ringtone-${id} .btn-download-ringtone`),
            url = $ringtone.attr("href"),
            name =  $ringtone.attr("download");
        //console.log(url)
        name += ($this.hasClass("btn-ios")) ? '.m4r' : '.mp3';
        download(url,name);
        setTimeout(function(){
            $.ajax({
                url: `${domain}/interactive/ringtone?act=download`,
                data: {
                    id: id,
                    token: token
                },
                method: "POST",
                success: function(rs) {
                    if (rs.code == 1) {
                        let text = $ringtone.find("span").text();
                        let numDownload = (text!="") ? parseInt(text) : 0;
                        $ringtone.find("span").text(numDownload + 1);
                        $this.closest("#ringtonePopup").removeClass("open");
                    }
                    token = rs.token;
                }
            })
        }, 500);
    });

    $(".ringtones .btn-download-ringtone").click(function(e){
        e.preventDefault();
        var $this = $(this),
            id = $this.closest(".ringtone").data("id"),
            name = $this.closest(".ringtone").find(".mp3 span").text().trim();
            ringtonePopup = $("#ringtonePopup");
        ringtonePopup.find(".popup").removeClass("done");
        ringtonePopup.toggleClass("open");
        ringtonePopup.find(".ringtoneName").text(name);
        var counter = 5;
        var interval = setInterval(() => {
            if(counter <= 0){
                ringtonePopup.find(".popup").addClass("done");
                ringtonePopup.find(".button-holder .btn").attr("data-id", id);
                counter = 5;
                clearInterval(interval);
            }
            ringtonePopup.find(".counter").html(`( ${counter} )`);
            counter--;
        }, 1000);
    });

    function download(url, filename) {
        fetch(url).then(function(t) {
            return t.blob().then((b)=>{
                var a = document.createElement("a");
                a.href = URL.createObjectURL(b);
                a.setAttribute("download", filename);
                a.click();
            });
        });
    }

    // Search
    var timeSearch = 0, tsearch = "";
    $('.form-search input[name=s]').on('input', function(e) {
        clearTimeout(timeSearch);
        $this = $(this);
        timeSearch = setTimeout(function() {
            var strInput = $this.val(),
                query = strInput.toLowerCase();
            if (query.length > 0) {
                $.ajax({
                    url: `${domain}/suggest`,
                    data: { s: query },
                    method: "POST",
                    success: function(rs) {
                        var rsSuggestText = "",
                            suggestText = "";
                        query = rs.keyword;
                        rs.data.forEach(function(s, index) {
                            var title = s.title.toLowerCase();
                            var tmp = title.replace(new RegExp(`${query}`, "g"), `<strong>${query}</strong>`);
                            rsSuggestText += `<p id="${index+1}" class="s-item">${tmp}</p>`;
                            if(index==0){
                                suggestText = title;
                            }
                        });
                        rsSuggestText = (rsSuggestText.length > 0) ? `<div class="suggestions-holder">${rsSuggestText}</div>` : "";
                        $this.closest("form").find("#suggestions").html(rsSuggestText);
                        var match = suggestText.match(new RegExp(`^${query}`,"g"));
                        suggestText = (match) ? suggestText : "";
                        suggestText = (suggestText!="")? `${strInput}${suggestText.substr(query.length)}`: "";
                        $this.closest("form").find("#suggest-text").html(suggestText);
                        $this.closest("form").addClass("searching");
                    }
                });
            } else {                
                $this.closest("form").find("#suggestions").html("");
                $this.closest("form").find("#suggest-text").html("");
            }
        }, 300);
    });

    $('.form-search input[name=s]').on('keyup', function(e) {
        var $this = $(this),
            $frm = $this.closest("form"),
            suggestText = "";
        if (e.keyCode == 38 || e.keyCode == 40) {
            e.preventDefault();
            var $suggestions = $frm.find("#suggestions .s-item"),
                $sItemActive = $frm.find("#suggestions .s-item.active"),
                curIndex = parseInt($sItemActive.attr("id") || 0),
                maxLength = $suggestions.length;

            if (e.keyCode == 38) {
                curIndex -= 1;
            }
            if (e.keyCode == 40) {
                curIndex += 1;
            }
            curIndex = (curIndex == -1) ? maxLength : curIndex;
            if (curIndex >= 1 && curIndex <= maxLength) {
                $frm.find("#suggestions .s-item").removeClass("active");
                $frm.find(`#suggestions #${curIndex}`).addClass("active");
                var textSearch = $frm.find(`#suggestions #${curIndex}`).html().trim();
                textSearch = textSearch.replace(/<strong>|<\/strong>/g, "");
                $frm.find('input[name="s"]').val(textSearch);
                $this.closest("form").find("#suggest-text").html("");
                suggestText = "";
            } else {                
                $frm.find("#suggestions .s-item").removeClass("active");
                $frm.find('input[name="s"]').val(tsearch);
                suggestText = $frm.find("#suggestions .s-item:nth-child(1)").text() || "";
            }
        } else {
            tsearch = $(this).val();
            suggestText = $frm.find("#suggestions .s-item:nth-child(1)").text() || "";        
        }        
        suggestText = suggestText.replace(/<strong>|<\/strong>/g, "");
        suggestText = (suggestText!="")? `${tsearch}${suggestText.substr(tsearch.length)}`: "";
        $frm.find("#suggest-text").html(suggestText);
    });
    
    $('.form-search').click(function(e) {
        var $this = $(this);
        setTimeout(function(){
            $this.closest(".form-search").addClass("searching");
        }, 1);
    });
    
    $('.form-search input[name=s]').focusout(function(e) {
        var $this = $(this);
        setTimeout(function(){
            $this.closest(".form-search").removeClass("searching");
        }, 300);
    });
    
    $(".form-search #suggestions").on("click", ".s-item", function(e) {
        e.preventDefault();
        $(this).closest("form").find(".s-item").removeClass("active");
        $(this).addClass("active");
        $(this).closest("form").submit();
    });
    
    $('.form-search').submit(function(e) {
        var textSearch = $(this).find('input[name="s"]').val(),
            suggestText = $(this).find(".s-item.active").html() || "";
        textSearch = ((suggestText != "") ? suggestText : textSearch).trim();
        textSearch = textSearch.replace(/<strong>|<\/strong>/g, "");
        if (textSearch.length > 0) {
            $(this).closest("form").find('input[name="s"]').val(textSearch);
        } else {
            e.preventDefault();
        }
    });

    $('#search-holder').on('click', function(e) {
        if (e.target !== this)
            return;
        $(this).toggleClass("open");
    });

    loadUser();
    function loadUser(){
        var uHolder = $("#menu-holder .login");
        if(uHolder.length > 0){
            var adBar = $("#adminBar"),
                pt = adBar.data("ptype") || "",
                pi = adBar.data("pid") || 0;
            $.ajax({
                url: `/account/nonecache`,
                method: "GET",
                data: {
                    ptype: pt,
                    pid: pi,
                },
                success: function(rs){                    
                    if(rs.code==1){
                        uHolder.html(rs.html.user);
                        adBar.html(rs.html.adbar);
                    }
                },
                error: function(error){}
            });
        }
    }

    $("#btn-page-scroll").click(function() {
        window.scroll({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });
    });

    $(window).scroll(function() {                    
        var $this = $(this);
        if ($this.scrollTop() >= 200) {
            $("#btn-page-scroll").addClass("show");
        } else {
            $("#btn-page-scroll").removeClass("show");
        }        
    });

    var $ApkOriginal = $("#ApkOriginal");
    if($ApkOriginal.length > 0){
        //if($this.scrollTop() >= 10 && !$ApkOriginal.hasClass("processing")){                
        if(!$ApkOriginal.hasClass("processing")){                
            var $htmlClone = $ApkOriginal.find(".box-cross").clone(true, true);
            $ApkOriginal.html("");
            $ApkOriginal.addClass("processing");
            $.ajax({
                method: "POST",
                url: `${domain}/getapk`,
                data:{
                    pid: $ApkOriginal.data("id"),
                    appid: $ApkOriginal.data("name")
                },
                beforeSend: function() {
                    $ApkOriginal.html('<div class="text-center"><div class="lds-roller"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div></div>');
                },
                success: function(rs){
                    if(rs.code==1){
                        //console.log(rs.data)
                        var obb = (rs.data.obb) ? rs.data.obb : "";
                        var apkSize = (rs.data.size) ? rs.data.size : '';
                        var apkLinkName = $htmlClone.find(".item-apk a span").text().trim();
                        apkLinkName += (apkSize.length > 0) ? ` [${apkSize}]` : '';
                        $htmlClone.find(".item-apk a span").text(apkLinkName);
                        if(obb.length <= 0){
                            $htmlClone.find(".item-obb").html("");
                        }else{                
                            apkSize = (rs.data.obbsize) ? rs.data.obbsize : '';                
                            //apkLinkName = $htmlClone.find(".item-obb a span").text().trim();
                            //apkLinkName += (apkSize.length > 0) ? ` [${apkSize}]` : '';
                            apkLinkName = `File OBB ${rs.data.version} Original [${apkSize}]`;
                            $htmlClone.find(".item-obb a span").text(apkLinkName);
                        }
                        $ApkOriginal.html($htmlClone);
                    }else{
                        $("#bh-original").remove();
                        $ApkOriginal.html("");
                    }
                },
                error: function(err){
                    $ApkOriginal.html("");
                }
            });
        }
    }

    $(".pagePopup").on("click", ".close", function(e){
        e.preventDefault();
        $(this).closest(".pagePopup").removeClass("open");
    });

    $("#sendFeedback").click(function(e){
        e.preventDefault();
        $("#pageFeedback").toggleClass("open");
    });

    $("#pageFeedback").on("click", ".chooseimg", function(e){
        e.preventDefault();
        $(this).closest(".line-file").find(".file").trigger("click");
    });

    $("#pageFeedback").on("change", "input[name=type]", function(e){
        e.preventDefault();
        if($(this).val()=="0") $(this).closest(".line-type").find("textarea").addClass("show");
        else $(this).closest(".line-type").find("textarea").removeClass("show");
    });

    $("#pageFeedback form").submit(function(e){
        e.preventDefault();
        var form = $(this)[0];
        var data = new FormData(form);
        var content = $(this).find("input[name=type]:checked").val();
        content = (content=="0") ? $(this).find("textarea[name=other]").val() : content;
        data.append("content", content);
        $(this).find(".submit").prop("disabled", true);
        $.ajax({
            url: $(this).attr("action"),
            type: 'post',
            enctype: 'multipart/form-data',
            data: data,
            cache: false,
            contentType: false,
            processData: false,
            success: (rs) => {
                let msg = (rs.code==0) ? `<p class="text-error mb-10">${rs.message}</p>` : `<p class="text-success mb-10">${rs.message}</p>`;                
                $(this).find(".rs-msg").html(msg);                
                if(rs.code==1) $("#pageFeedback form")[0].reset(), setTimeout(function(){$("#pageFeedback").removeClass("open")}, 2000);
                else $(this).find(".submit").prop("disabled", false);
            }
        });
    });

    // Comments
    $("#comments form").submit(function(e) {
        e.preventDefault();
        var $this = $(this);
        var popup = $("#pagePopup");
        var bigText = popup.find(".bigText");
        var subText = popup.find(".subText");
        $.ajax({
            url: $this.attr("action"),
            data: $this.serialize(),
            method: "POST",
            success: function(rs) {                    
                let smgClass = (rs.code==1) ? "text-success" : "text-danger";
                if (rs.code == 401) {
                    bigText.text(rs.message);
                    subText.html(rs.button);
                }else{                    
                    if(rs.code==1){
                        $this.find('input[name="parentid"]').val(null);
                        $this.find('textarea[name="content"]').val("");
                        $this.find('input[name="rating"]').prop("checked", false);
                        $this.find('.msg-reply-holder').html("");
                    }
                    bigText.text(bigText.data("text"));
                    popup.find(".subText").html(`<div class="${smgClass}">${rs.message}</div>`);
                }
                $this.find('input[name="token"]').val(rs.token);                
                popup.addClass("open");
            },
            error: function(){}
        });
    });
    $("#comments").on("click", "a.reply", function(e) {
        e.preventDefault();
        var $this = $(this),
            $frm = $this.closest("#comments").find("form"),
            $li = $this.closest(".comment"),
            replyAuthor = $li.data("text"),
            id = $li.data("id");
        $frm.find('input[name="parentid"]').val(id);
        $frm.find(".msg-reply-holder").html(`<div class="msg">${replyAuthor}</div>`);
        $frm.find('textarea[name="content"]').focus();
    });
    $("#comments").on("click", ".msg-reply-holder", function(e) {
        e.preventDefault();
        var $this = $(this),
            $frm = $this.closest("#comments").find("form");
        $frm.find('input[name="parentid"]').val(null);
        $this.html("");
    });
    $("#comments").on("click", ".btn-seemore-comment", function(e) {
        e.preventDefault();
        var $this = $(this),
            pid = $this.data("pid"),
            lid = $this.closest("#comments").data("lid"),
            sort = $this.closest(".lch-sort").find(".lchs-current").data("sort"),
            total = $this.data("total"),
            offset = parseInt($this.closest("#comments").find(".list-comments>li").length) || 0;
        $this.prop("disabled", true);
        $.ajax({
            url: `${domain}/comment/ajax`,
            data: {
                sort: sort,
                pid: pid,
                lid: lid,
                offset: offset
            },
            method: "POST",
            success: function(rs) {
                $this.prop("disabled", false);
                if (rs.code == 1) {
                    $this.closest("#comments").find(".list-comments").append(rs.data);
                    offset = parseInt($this.closest("#comments").find(".list-comments>li").length);
                    $this.find("span").text(total - offset);
                    if (total - offset <= 0)
                        $this.addClass("hidden");
                }
            }
        });
    });
    $("#comments").on("click", ".btn-seemore-reply", function(e) {
        e.preventDefault();
        var $this = $(this),
            pid = $this.data("pid"),
            lid =  $this.closest("#comments").data("lid"),
            total = $this.data("total"),
            sort = $this.closest(".lch-sort").find(".lchs-current").data("sort"),
            offset = parseInt($this.closest("#comments").find(".list-replies>li").length) || 0;
        $this.prop("disabled", true);
        $.ajax({
            url: `${domain}/comment/reply/ajax`,
            data: {
                sort: sort,
                parentid: pid,
                lid: lid,
                offset: offset
            },
            method: "POST",
            success: function(rs) {
                $this.prop("disabled", false);
                if (rs.code == 1) {
                    $this.closest(".comment").find(".list-replies").append(rs.data);
                    offset = parseInt($this.closest(".comment").find(".list-replies>li").length) || 0;
                    $this.find("span").text(total - offset);
                    if (total - offset <= 0)
                        $this.addClass("hidden");
                }
            }
        })
    });
    $("#comments").on("click", ".lch-sort .lchs-item", function(e){
        e.preventDefault();
        var $this = $(this),
            sort = $this.data("sort"),
            text = $this.data("text"),
            pid = $this.closest("#comments").data("pid"),
            lid = $this.closest("#comments").data("lid"),
            $btnLoad = $this.closest("#comments").find(".btn-seemore-comment");
        $.ajax({
            url: `${ldomain}/comment/ajax`,
            data: {
                sort: sort,
                pid: pid,
                lid: lid,                
                offset: 0
            },
            method: "POST",
            success: function(rs) {
                if (rs.code == 1) {
                    var numHide = $btnLoad.data("numhide");
                    $this.closest(".lch-sort").toggleClass("open");
                    $this.closest(".lch-sort").find(".lchs-current").text(text);
                    $this.closest(".lch-sort").find(".lchs-current").attr("data-sort", sort);
                    $btnLoad.find("span").html(numHide);
                    $btnLoad.removeClass("hidden");
                    $this.closest(".holder-comments").find(".lch-body .lc-wrap").html(rs.data);
                }
            }
        });
    });
    $("#comments").on("click", ".links .like", function(e){
        e.preventDefault();
        var $this = $(this),           
            id = $this.closest(".comment").data("id"),
            popup = $("#pagePopup"),
            bigText = popup.find(".bigText"),
            subText = popup.find(".subText");
        $.ajax({
            url: `${ldomain}/comment/like`,
            data: {id: id},
            method: "POST",
            success: function(rs) {
                let smgClass = (rs.code==1) ? "text-success" : "text-danger";
                if(rs.code==1){
                    var text = (rs.numLike > 0) ? `<small>(${rs.numLike})</small>` : '';
                    text = (rs.isLike) ? `Like ${text}` : `Unlike ${text}`;
                    $this.find("span").html(text);
                    if(!rs.isLike) $this.addClass("unlike");
                }else{
                    bigText.text(rs.message);
                    subText.html(rs.button);
                    bigText.text(bigText.data("text"));
                    popup.find(".subText").html(`<div class="${smgClass}">${rs.message}</div>`);
                    popup.addClass("open");
                }
                
            }
        });
    });
    // Form
    $('#frm-login').submit(function(e) {
        e.preventDefault();
        var url = $(this).attr("action");
        var $frm = $(this);
        $.ajax({
            type: "POST",
            url: url,
            data: $(this).serialize(),
            beforeSend: function(){
                $frm.find("button").prop("disabled", true);
                $frm.find(".fg-popup-error").html('<div class="text-center"><div class="lds-roller"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div></div>');
            },
            success: function(data) {
                if (data.code == 1) {
                    location.reload();
                }
                $frm.find(".fg-popup-error").html('<div class="alert alert-danger">' + data.message + '</div>');
            }
        }).done(function(){
            $frm.find("button").prop("disabled", false);
        })
    });
    $(".fef-submit").submit(function(e){
        e.preventDefault();
        var url = $(this).attr("action");
        var $frm = $(this);
        $.ajax({
            type: "POST",
            url: url,
            data: $(this).serialize(),
            beforeSend: function(){
                $frm.find(".btn-fef-submit").prop("disabled", true);
                $frm.find(".fg-popup-error").html('<div class="text-center"><div class="lds-roller"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div></div>');
            },
            success: function(data) {
                $(".fg-input").find(".error").text("");
                var error = (data.data) ? data.data : [];
                $.each(error, function(idx, item){
                    $(`#${item.id}`).closest(".fg-input").find(".error").text(item.msg);
                })
                var alertClass = (data.code==1) ? "alert-success" : "alert-danger";
                if(data.message && data.message.length > 0 ){
                    $frm.find(".fg-popup-error").html(`<div class="alert ${alertClass}">` + data.message + '</div>');
                }else{
                    $frm.find(".fg-popup-error").html("");
                }
                if(data.code==1){
                    $frm[0].reset();
                }
            }
        }).done(function(){
            $frm.find(".btn-fef-submit").prop("disabled", false);
        })
    });
    $(".box-form").submit(function(e){
        e.preventDefault();
        var url = $(this).attr("action");
        var $frm = $(this);
        $.ajax({
            type: "POST",
            url: url,
            data: $(this).serialize(),
            beforeSend: function(){
                $frm.find("button").prop("disabled", true);
                $frm.find(".bfl-error").html('<div class="text-center"><i class="tb-icon icon-spin"></i></div>');
            },
            success: function(data) {
                console.log(data)
                $(".bf-line").find(".error").text("");
                var error = (data.data) ? data.data : [];
                $.each(error, function(idx, item){
                    $(`#${item.id}`).closest(".bf-line").find(".error").text(item.msg);
                })
                var alertClass = (data.code==1) ? "alert-success" : "alert-danger";
                if(data.message && data.message.length > 0 ){
                    $frm.find(".bfl-error").html(`<div class="alert ${alertClass}">` + data.message + '</div>');
                }else{
                    $frm.find(".bfl-error").html("");
                }
                if(data.code==1){
                    var reset = $frm.data("reset") || false;
                    if(!reset)
                        $frm[0].reset();
                }
            }
        }).done(function(){
            $frm.find("button").prop("disabled", false);
        })
    });
    $(".btn-fef-sendcode").click(function(e){
        e.preventDefault();
        var $frm = $(this).closest("form"),
            email = $frm.find("#email").val(),
            url = $frm.attr("action");
        url = url.replace(/password-recovery$/g, "sendcode");
        $.ajax({
            type: "POST",
            url: url,
            data: {
                email: email
            },
            beforeSend: function(){
                $frm.find("button").prop("disabled", true);
                $frm.find(".fg-popup-error").html('<div class="text-center"><i class="tb-icon icon-spin"></i></div>');
            },
            success: function(data) {
                var alertClass = (data.code==1) ? "alert-success" : "alert-danger";
                if(data.message && data.message.length > 0 ){
                    $frm.find(".fg-popup-error").html(`<div class="alert ${alertClass}">` + data.message + '</div>');
                }else{
                    $frm.find(".fg-popup-error").html("");
                }
                $(".fg-input").find(".error").text("");
                var error = (data.data) ? data.data : [];
                $.each(error, function(idx, item){
                    $(`#${item.id}`).closest(".fg-input").find(".error").text(item.msg);
                })
            }
        }).done(function(){
            $frm.find("button").prop("disabled", false);
        })
    });
    $("#btn-change-avatar").click(function(e){
        $("#change-avatar-file").trigger("click");
    });
    $("#change-avatar-file").change(function(e){
        e.preventDefault()
        var $img = $(this).closest(".bp-change-avatar").find("img");
        if($(this)[0].files.length > 0){
            var fd = new FormData();
            var file = $(this)[0].files[0];
            fd.append('file', file);
            $.ajax({
                url: `/account/avatar`,
                type: 'post',
                enctype: 'multipart/form-data',
                data: fd,
                cache: false,
                contentType: false,
                processData: false,
                success: function(rs) {
                    if(rs.code==1){
                        $img.attr("src", rs.img);
                    }else{
                        alert(rs.message)
                    }
                }
            });
        }
    });
    // Feedback
    // load more replies
    $(".form-feedback").submit(function(e) {
        e.preventDefault();
        var $this = $(this);
        var popup = $("#pagePopup");
        var bigText = popup.find(".bigText");
        var subText = popup.find(".subText");
        $.ajax({
            url: $this.attr("action"),
            data: $this.serialize(),
            method: "POST",
            success: function(rs) {
                let smgClass = (rs.code==1) ? "text-success" : "text-danger";
                if (rs.code == 401) {
                    bigText.text(rs.message);
                    subText.html(rs.button);
                }else{                    
                    if(rs.code==1){
                        $this[0].reset();
                    }
                    bigText.text(bigText.data("text"));
                    popup.find(".subText").html(`<div class="${smgClass}">${rs.message}</div>`);
                }
                $this.find('input[name="token"]').val(rs.token);                
                popup.addClass("open");
            }
        })
    });

    $("#btn-sc-category").click(function(e){
        var $li = $(this).closest("li"),
            flag = $li.hasClass("active");
        $(this).closest(".sort-controls").find("li").removeClass("active");
        if(flag){
            $li.removeClass("active");
        }else{
            $li.addClass("active");
        }        
        $(this).closest(".list-holder").find(".box-categories").toggleClass("open");        
    });    
})