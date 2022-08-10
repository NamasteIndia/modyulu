"use strict";
jQuery(document).ready(function() {
    var table = $('#datatable-sside');
    // begin first table
    table.DataTable({
        responsive: false,
        searchDelay: 1000,
        processing: true,
        serverSide: true,
        dom: '<"top">t<"bottom"lp><"clear">', // off search box
        ajax: `/${dashboard}/media/datatable/`,
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
                        domRoleHtml += `<a class="btnDTR btn-load-modal-edit" data-id="${data.id}" href="javascript:void(0)">Edit</a>`;
                    }
                    if(data.roledel == true || data.mine == data.author){
                        domRoleHtml += `<a class="btnDTR btnDTRDelete" href="/${dashboard}/media/delete/${data.id}">Delete</a>`;
                    }
                    return `<img class="rounded float-left" src="${data.urlicon}" alt="${data.title}" width="70px" height="auto">
                            <div style="margin-left: 80px;">
                                <div class="row-name">${data.title}</div>
                                <div>${data.filename}</div>
                                <div class="row-actions">
                                ${domRoleHtml}
                                </div>
                            </div>`;
                }
            },
            {
                data: function(data, type, dataToSet) {
                    if (data.Author != null) {
                        return `<a href="javascript:void(0);" alt="${data.Author.username}">${data.Author.username}</a>`;
                    }
                    return '';
                }
            },
            { data: 'seotitle' },
            { data: 'description' },
            { data: 'filesize' },
            { data: 'createdAt' }
        ],
        columnDefs: [{
            'targets': 0,
            'searchable': false,
            'orderable': false,
            'className': 'dt-body-center'
        }, {
            targets: 6,
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
});