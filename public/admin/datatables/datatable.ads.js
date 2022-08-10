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
        ajax: `/${dashboard}/ads/datatable/`,
        columns: [
            { 
                data: function(data, type, dataToSet) {
                    if(data.roledel == true){
                        return '<input type="checkbox" name="id[]" value="' + $('<div/>').text(data.id).html() + '">';
                    }
                    return "";
                }
            },
            { data: 'adscode' },
            {
                data: function(data, type, dataToSet) {
                    var domRoleHtml = '';
                    if(data.roleedit == true || data.mine == data.author){
                        domRoleHtml += `<a class="btnDTR btn-load-modal-edit" data-id="${data.id}" href="javascript:void(0);">Edit</a>`;
                    }
                    if(data.roledel == true || data.mine == data.author){
                        domRoleHtml += `<a class="btnDTR btnDTRDanger btnDTRDelete" data-id="${data.id}" href="/${dashboard}/ads/delete/${data.id}">Delete</a>`;
                    }
                    return `<div class="row-name">${data.name}</div>
                            <div class="row-actions">${domRoleHtml}</div>`;
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
            { 
                data: function(data, type, dataToSet) {
                    return createDataColumnToggleAajx(data.id, data.isheader, "isheader", "Enable", "Disable", false);
                }
            },
            { 
                data: function(data, type, dataToSet) {
                    return createDataColumnToggleAajx(data.id, data.appearheader, "appearheader", "Enable", "Disable", false);
                }
            },            
            { 
                data: function(data, type, dataToSet) {
                    return createDataColumnToggleAajx(data.id, data.islazy, "islazy", "Enable", "Disable", false);
                }
            },
            { 
                data: function(data, type, dataToSet) {
                    return createDataColumnToggleAajx(data.id, data.offads, "offads", "Enable", "Disable", false);
                }
            },
            {
                data: function(data, type, dataToSet) {
                    return createDataColumnToggleAajx(data.id, data.isdefault, "isdefault", "Enable", "Disable", false);
                }
            },
            { 
                data: function(data, type, dataToSet) {
                    return createDataColumnToggleAajx(data.id, !data.isblock, "isblock", "Enable", "Disable", true);
                }
            }
        ],
        columnDefs: [{
            'targets': 0,
            'searchable': false,
            'orderable': false,
            'className': 'dt-body-center'
        }, {
            targets: 4,
            orderable: false
        }, {
            targets: 5,
            orderable: false
        }, {
            targets: 6,
            orderable: false
        }, {
            targets: 7,
            orderable: false
        }, {
            targets: 8,
            orderable: false
        }, {
            targets: 9,
            orderable: false
        }],
        order: [
            [1, "ASC"]
        ]
    });
    var oTable = $('#datatable-sside').DataTable();
});