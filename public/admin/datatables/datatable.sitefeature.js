"use strict";
jQuery(document).ready(function() {
    var table = $('#datatable-sside');
    table.DataTable({
        responsive: false,
        searchDelay: 1000,
        processing: true,
        serverSide: true,
        dom: '<"top">t<"bottom"lp><"clear">',
        ajax: `/${dashboard}/sitefeature/datatable`,
        columns: [
            { 
                data: function(data, type, dataToSet) {
                    if(data.roledel == true){
                        return '<input type="checkbox" name="id[]" value="' + $('<div/>').text(data.id).html() + '">';
                    }
                    return "";
                }
            },
            { data: 'icon' },
            {
                data: function(data, type, dataToSet) {
                    var domRoleHtml = '';
                    console.log(data)
                    if(data.roleedit == true){
                        domRoleHtml += `<a data-id="${data.id}" class="btnDTR btn-load-modal-edit" href="javascript:void(0)">Edit</a>`;
                    }
                    if(data.roledel == true){
                        domRoleHtml += `<a class="btnDTR btnDTRDelete" href="/${dashboard}/sitefeature/delete/${data.id}">Delete</a>`;
                    }
                    return `<span class="row-name">${data.name}</span>
                            <div class="row-actions">${domRoleHtml}</div>`;
                }
            },
            { data: 'title' },
            { data: 'description' },
            { data: 'url' },
            { 
                data: function(data, type, dataToSet) {
                    return (data.parent) ? data.parent.name : "";
                }
            },
            {
                data: function(data, type, dataToSet) {
                    return createDataColumnToggleAajx(data.id, data.nolink, "nolink", "A menu feature", "Just a blank menu", false);
                }
            },
            { data: 'createdAt' }
        ],
        columnDefs: [{
            'targets': 0,
            'searchable': false,
            'orderable': false,
            'className': 'dt-body-center'
        }, {
            "targets": 7,
            'searchable': false,
            'orderable': false
        }, {
            targets: 8,
            className: "text-right",
            render: function(data, type, full, meta) {
                var dateText = formart_datetime(data, "full");
                return dateText;
            },
        }],
        order: [2, 'ASC']
    });
    var oTable = $('#datatable-sside').DataTable();
});