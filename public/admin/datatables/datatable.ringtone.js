"use strict";
jQuery(document).ready(function() {
    var ajaxUrl =  `/${dashboard}/post/${posttype}/file/${postid}/datatable`;
    $('#datatable-sside').DataTable({
        responsive: false,
        searchDelay: 1000,
        processing: true,
        serverSide: true,
        dom: '<"top">t<"bottom"lp><"clear">', // off search box
        ajax: ajaxUrl,
        columns: [
            { 
                data: function(data, type, dataToSet) {
                    if(data.roledel == true || data.mine == data.author){
                        return '<input type="checkbox" name="id[]" value="' + $('<div/>').text(data.id).html() + '">';
                    }
                    return "";
                }
            },
            { 
                data: function(data, type, dataToSet) {
                    var domRoleHtml = '';
                    if(data.roleedit == true || data.mine == data.author){
                        domRoleHtml += `<a class="btnDTR btn-load-modal-edit" data-id="${data.id}" href="javascript:void(0);">Edit</a>`;
                    }
                    if(data.roleedit == true || data.mine == data.author){
                        domRoleHtml += `<a class="btnDTR btnDTRDanger btnDTRDelete" data-id="${data.id}" href="/${dashboard}/post/${posttype}/file/delete/${data.id}">Delete</a>`;
                    }
                    return `<div class="row-name">${data.name}</div>
                            <div class="row-actions">${domRoleHtml}</div>`;
                }
            },
            { data: 'url' },
            {
                data: function(data, type, dataToSet) {
                    if (data.Author != null) {
                        return `<a href="javascript:void(0);" alt="${data.Author.username}">${data.Author.username}</a>`;
                    }
                    return "";
                }
            },
            { data: 'filesize' },
            { data: 'updatedAt' }
        ],
        columnDefs: [{
            'targets': 0,
            'searchable': false,
            'orderable': false,
            'className': 'dt-body-center'
        }, {
            targets: 5,
            className: "text-right",
            render: function(data, type, full, meta) {
                var dateText = formart_datetime(data, "full");
                return dateText;
            },
        }],
        order: [
            [0, "desc"]
        ]
    });
    var oTable = $('#datatable-sside').DataTable();

    // Hien thi chon file upload
    $("body").on("click", "#btn-add-ringtones", function(e) {
        e.preventDefault();
        $(this).closest(".datatable-search-header").find("#ringtoneUploadFiles").trigger("click");
    });

    // Thuc hien upload file
    $("#ringtoneUploadFiles").change(function(e) {
        e.preventDefault();        
        var form = $("#ringtoneUpload")[0];
        var fd = new FormData(form);
        $.ajax({
            url: 'https://ring.techbigs.download',
            type: 'POST',
            enctype: 'multipart/form-data',
            data: fd,
            cache: false,
            contentType: false,
            processData: false,
            beforeSend: function() {
                $("#btn-add-ringtones").html('processing...');
                $("#btn-add-ringtones").prop("disabled", true);
            },
            success: function(rs){
                try{
                    var pid = $("#ringtoneUpload").data("id");
                    var json = JSON.parse(rs);
                    var files = json.files;
                    if(files){
                        var data = [];
                        data = files.map(f => {
                            return {
                                postid: pid,
                                name: f.name,
                                filename: f.name,
                                url: f.url,
                                filetype: f.type,
                                filesize: f.size
                            }
                        });
                        if(data.length > 0){
                            $.ajax({
                                url: `/${dashboard}/post/${posttype}/file/${postid}/add`,
                                type: "POST",
                                data: {data: data},
                                success: function(rs){                                    
                                    swal.fire({
                                        icon: (rs.code==1) ? "success" : "error",
                                        text: rs.message,
                                        showConfirmButton: true
                                    }).then(() => {
                                        oTable.draw();
                                        $("#ringtoneUpload")[0].reset();
                                    })
                                },
                                error: function(error){
                                    alert("error ajax cms");
                                }
                            })
                        }
                    }
                }catch(err){
                    alert("error parser data json");
                }
            },
            error: function(error){
                alert("error ajax api");
            },
            complete: function() {
                $("#btn-add-ringtones").html('<i class="fas fa-cloud-upload-alt"></i><span>Add MP3 for Animal</span>');
                $("#btn-add-ringtones").prop("disabled", false);
            },
        });
    });    
});