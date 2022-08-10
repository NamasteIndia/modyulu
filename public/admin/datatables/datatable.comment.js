"use strict";
jQuery(document).ready(function() {
    var table = $('#datatable-sside');
    // begin first table
    table.DataTable({
        responsive: false,
        searchDelay: 1000,
        processing: true,
        serverSide: true,
        dom: '<"top">t<"bottom"lp><"clear">',
        ajax: `/${dashboard}/comment/datatable`,
        columns: [
            { 
                data: function(data, type, dataToSet) {
                    if(data.roledel == true || data.mine == data.authorid){
                        return '<input type="checkbox" name="id[]" value="' + $('<div/>').text(data.id).html() + '">';
                    }
                    return "";
                }
            },
            {
                data: function(data, type, dataToSet) {
                    return `<div>${data.name}</div>
                            <div>${data.email}</div>
                            <div>${data.ipaddress}</div>`;
                }
            },
            {
                data: function(data, type, dataToSet) {
                    let replyText = (data.parent !== null) ? `<div class="dt-reply-text">Reply to <span>${data.parent.name}</span> in <span>${data.post.title}</span></div>` : "";
                    var domRoleHtml = '';
                    if(data.roleadd == true || data.mine == data.authorid){
                        domRoleHtml = `<a class="btnDTR btn-comment-reply" data-id="${data.id}" data-postid="${data.post.id}" href="javascript:void(0);">Reply</a>`;
                    }
                    if(data.roleedit == true || data.mine == data.authorid){
                        domRoleHtml = `<a class="btnDTR btn-change-status" data-id="${data.id}" data-col="commentstatus" data-value="${(data.commentstatus!="published")?"published":"pending"}" href="javascript:void(0);">
                                            ${(data.commentstatus!="published")?"Approve": "Unapprove"}
                                        </a>
                                        ${domRoleHtml}
                                        <a class="btnDTR btn-load-modal-edit" data-id="${data.id}" href="javascript:void(0)">Edit</a>
                                        <a class="btnDTR btnDTRDanger btn-change-status" data-id="${data.id}" data-col="commentstatus" data-value="${(data.commentstatus!="spam")?"spam":"published"}" href="javascript:void(0);">
                                            ${(data.commentstatus!="spam")?"Spam": "Not spam"}
                                        </a>
                                        <a class="btnDTR btnDTRDanger btn-change-status" data-id="${data.id}" data-col="commentstatus" data-value="${(data.commentstatus!="trash")?"trash":"pending"}" href="javascript:void(0);">
                                            ${(data.commentstatus!="trash")?"Trash": "Restore"}
                                        </a>`;
                    }
                    if(data.roledel == true || data.mine == data.authorid){
                        domRoleHtml += `<a class="btnDTR btnDTRDanger btnDTRDelete" data-id="${data.id}" href="/${dashboard}/comment/delete/${data.id}">Delete</a>`;
                    }
                    var rating = (data.rating && data.rating > 0) ? `<span>[${data.rating}★]</span>` : '';
                    return `${replyText}
                            <div class="row-name">${rating} ${data.content}</div>
                            <div class="row-actions">${domRoleHtml}</div>`;
                }
            },
            {
                data: function(data, type, dataToSet) {
                    let btnPendingTag = (data.pending > 0) ? `<a class="btn btn-sm btn-danger" href="${domain}/${dashboard}/comment/${data.post.id}/pending" title="Number unapprove comments of ${data.post.title}">${data.pending}</a>` : "";
                    return `<a target="_blank" href="${domain}/${data.post.slug}/" title="View ${data.post.title}">
                                ${data.post.title}
                            </a>
                            <div class="btn-comment-label mt-1">
                                <a class="btn btn-sm btn-dark" href="${domain}/${dashboard}/comment/${data.post.id}/published" title="Number approved comments of ${data.post.title}">${data.approve}</a>
                                ${btnPendingTag}
                            </div>`;
                }
            },
            {
                data: function(data, type, dataToSet) {
                    return formart_datetime(data.createdAt, "full")
                }
            }
        ],
        columnDefs: [{
            'targets': 0,
            'searchable': false,
            'orderable': false,
            'className': 'dt-body-center'
        }],
        order: [
            0, "DESC"
        ]
    });
    var oTable = $('#datatable-sside').DataTable();
    var $itemFilters = $(".datatable-filter-holder .item-filter");
    $.each($itemFilters, function(index, $item) {
        let valueSearch = $($item).val().trim();
        oTable.columns(index + 1).search(valueSearch);
    });
    oTable.draw();

    //load data to modal relay
    $("body").on("click", ".btn-comment-reply", function(e) {
        e.preventDefault();
        var $this = $(this),
            parentid = $this.attr("data-id"),
            postid = $this.attr("data-postid"),
            commentText = $this.closest("tr").find(".row-name").text();
        $("#frmReplyModal").find('input[name="parentid"]').val(parentid);
        $("#frmReplyModal").find('input[name="postid"]').val(postid);
        $("#frmReplyModal").find('.commentText').text(commentText);
        $("#frmReplyModal").modal();
    });
    $("#frmReplyComment").submit(function(e) {
        e.preventDefault();
        var $frm = $(this);
        $.ajax({
            url: $frm.attr("action"),
            data: $frm.serialize(),
            method: "POST",
            success: function(rs) {
                swal.fire({
                    icon: (rs.code == 1) ? "success" : "error",
                    position: "top-right",
                    title: rs.message,
                    showConfirmButton: false,
                    timer: 1000
                });
                oTable.draw();
                $("#frmReplyModal form")[0].reset();
                $("#frmReplyModal").modal("hide");
            },
            error: function(error) {
                swal.fire({
                    icon: "error",                    
                    text: error.responseJSON.message,
                    showConfirmButton: false
                });
            }
        })
    })
});