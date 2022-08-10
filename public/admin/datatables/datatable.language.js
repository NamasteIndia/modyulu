"use strict";
jQuery(document).ready(function() {
    var table = $('#datatable-sside');
    table.DataTable({
        responsive: false,
        searchDelay: 1000,
        processing: true,
        serverSide: true,
        dom: '<"top">t<"bottom"lp><"clear">',
        ajax: `/${dashboard}/language/datatable/`,
        columns: [            
            { 
                data: function(data, type, dataToSet) {
                    if(data.roledel == true){
                        return '<input type="checkbox" name="id[]" value="' + $('<div/>').text(data.id).html() + '">';
                    }
                    return "";
                }
            },
            { data: 'id', responsivePriority: -1 },
            {
                data: function(data, type, dataToSet) {
                    var domRoleHtml = '';
                    if(data.roleedit == true){
                        domRoleHtml += `<a class="btnDTR btn-load-modal-edit" data-id="${data.id}" href="javascript:void(0);">Edit</a>`;
                    }
                    if(data.roledel == true){
                        domRoleHtml += `<a class="btnDTR btnDTRDanger btnDTRDelete" data-id="${data.id}" href="/${dashboard}/language/delete/${data.id}">Delete</a>`;
                    }
                    return `<div class="row-name">${data.name}</div>
                            <div class="row-actions">${domRoleHtml}</div>`;
                }
            },
            { data: 'id', responsivePriority: -1 },            
            { data: 'codelang' },
            { data: 'area' },
            { 
                data: function(data, type, dataToSet) {
                    return createDataColumnToggleAajx(data.id, !data.isblock, "isblock", "Enable", "Disable", true);
                }
            },            
        ],
        columnDefs: [{
            'targets': 0,
            'searchable': false,
            'orderable': false,
            'className': 'dt-body-center'
        },{
            targets: 1,
            orderable: false,
            render: function(data, type, full, meta) {
                return `<img src="/${dashboard}/assets/img/flags/${data}.png" alt="${data}"/>`;
            },
        },{
            targets: 5,
            orderable: false            
        }],
        order: [
            [0, "desc"]
        ]
    });
});