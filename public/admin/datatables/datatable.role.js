"use strict";
jQuery(document).ready(function() {
    var table = $('#datatable-sside');
    table.DataTable({
        responsive: false,
        searchDelay: 1000,
        processing: true,
        serverSide: true,
        dom: '<"top">t<"bottom"lp><"clear">',
        ajax: `/${dashboard}/role/datatable/`,
        columns: [
            { 
                data: function(data, type, dataToSet) {
                    if(data.roledel == true){
                        return '<input type="checkbox" name="id[]" value="' + $('<div/>').text(data.id).html() + '">';
                    }
                    return "";
                }
            },
            { 
                data: function(data, type, dataToSet) {
                    var domRoleHtml = '';
                    if(data.roleedit == true){
                        domRoleHtml += `<a class="btnDTR btn-load-modal-edit" data-id="${data.id}" href="javascript:void(0);">Edit</a>`;
                    }
                    if(data.roledel == true){
                        domRoleHtml += `<a class="btnDTR btnDTRDanger btnDTRDelete" data-id="${data.id}" href="/${dashboard}/role/delete/${data.id}">Delete</a>`;
                    }
                    return `<div class="row-name">${data.rolename}</div>
                            <div class="row-actions">${domRoleHtml}</div>`;
                }
            },
            { data: 'description' },
            { data: 'ismaster' }
        ],
        columnDefs: [{
            'targets': 0,
            'searchable': false,
            'orderable': false,
            'className': 'dt-body-center'
        }, {
            targets: 3,
            orderable: false,
            render: function(data, type, full, meta) {
                if (!data) {
                    return `<div class="text-center"><div aria-hidden="true" title="Has role" class="score-icon"></div></div>`;
                } else {
                    return `<div class="text-center"><div aria-hidden="true" title="Full Privileges" class="score-icon good"></div></div>`;
                }
            },
        }],
        order: [
            [0, "asc"]
        ]
    });
    var oTable = $('#datatable-sside').DataTable();
});