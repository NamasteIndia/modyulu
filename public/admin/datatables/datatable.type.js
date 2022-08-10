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
        ajax: `/${dashboard}/type/datatable`,
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
                    if(data.roleedit == true){
                        domRoleHtml += `<a class="btnDTR btnDTREdit" href="/${dashboard}/type/edit/${data.id}">Edit</a>`;
                    }
                    if(data.roledel == true){
                        domRoleHtml += `<a class="btnDTR btnDTRDelete" href="/${dashboard}/type/delete/${data.id}">Delete</a>`;
                    }
                    return `<span>${data.name}</span>
                            <div class="row-actions">${domRoleHtml}</div>`;
                }
            },
            { data: 'description' },
            { data: 'roottext' },
            { data: 'exttext' },
            { data: 'type' },
            { data: 'cateitemtype'},
            {
                data: function(data, type, dataToSet) {
                    return createDataColumnToggleAajx(data.id, data.allowfollow, "allowfollow", "Allow Follow", "No Follow", false);
                }
            },
            {
                data: function(data, type, dataToSet) {
                    return createDataColumnToggleAajx(data.id, data.allowindex, "allowindex", "Allow Index", "No Index", false);
                }
            },
            {
                data: function(data, type, dataToSet) {
                    return createDataColumnToggleAajx(data.id, data.hassitemap, "hassitemap", "Has sitemap", "No sitemap", false);
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
            "targets": 2,
            "className": "row-name",
            render: function(data, type, full, meta) {
                return data;
            }
        }, {
            "targets": 7,
            'searchable': false,
            'orderable': false
        }, {
            "targets": 8,
            'searchable': false,
            'orderable': false
        }, {
            "targets": 9,
            'searchable': false,
            'orderable': false
        }, {
            "targets": 10,
            'searchable': false,
            'orderable': false
        }]
    });
    var oTable = $('#datatable-sside').DataTable();
});