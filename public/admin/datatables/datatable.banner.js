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
        ajax: `/${dashboard}/banner/datatable`,
        columns: [
            { 
                data: function(data, type, dataToSet) {
                    if(data.roledel == true){
                        return '<input type="checkbox" name="id[]" value="' + $('<div/>').text(data.id).html() + '">';
                    }
                    return "";
                    console.log(data)
                }
            },
            {
                data: function(data, type, dataToSet) {
                    var domRoleHtml = '';
                    if(data.roleedit){
                        domRoleHtml += `<a class="btnDTR btn-load-modal-edit" data-id="${data.id}" href="javascript:void(0)">Edit</a>`;
                    }
                    if(data.roledel){
                        domRoleHtml += `<a class="btnDTR btnDTRDelete" href="/${dashboard}/banner/delete/${data.id}">Delete</a>`;
                    }
                    return `<span>${data.langid}</span>
                            <div class="row-actions">${domRoleHtml}</div>`;
                }
            },
            { data: 'title' },
            { data: 'img' },
            { data: 'url' },            
            {
                data: function(data, type, dataToSet) {
                    return createDataColumnToggleAajx(data.id, data.default, "default", "Default", "None", false);
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
            "className": "row-name"
        }, {
            "targets": 5,
            'searchable': false,
            'orderable': false
        }, {
            "targets": 6,
            'searchable': false,
            'orderable': false
        }]
    });
    var oTable = $('#datatable-sside').DataTable();
});