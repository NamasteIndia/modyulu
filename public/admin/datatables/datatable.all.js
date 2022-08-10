$(function() {
    // NEW TABLE ACTION
    // Check ALL
    $('#datatable-select-all').on('click', function() {
        var rows = $('#datatable-sside tbody tr');
        $('input[name="id[]"]', rows).prop('checked', this.checked);
    });
    // Check row item
    $('#datatable-sside tbody').on('change', 'input[name="id[]"]', function() {
        if (!this.checked) {
            var el = $('#datatable-select-all').get(0);
            if (el && el.checked && ('indeterminate' in el)) {
                el.indeterminate = true;
            }
        }
    });
    //Click button Filter
    $(".datatable-filter-holder").on("click", "#btnDTFileter", function(e) {
        e.preventDefault();
        refreshDatatable();
    });
    //Text change in filter group
    let time = 0;
    $('.datatable-filter-holder input.item-filter').on('input', function() {
        clearTimeout(time);
        $this = $(this);
        time = setTimeout(function() {
            refreshDatatable();
        }, 500);
    });
    //Change select i filter group
    $(".datatable-filter-holder").on("change", ".item-filter", function(e) {
        e.preventDefault();
        if($(this).hasClass("item-trash")){
            let value = $(this).val();
            if(value=="trash"){
                $("#slBulk").append(`<option value="restore">Restore</option>`);
            }else{
                $("#slBulk option").filter(function() {
                    return this.value == "restore";
                }).remove();
            }
        }
        refreshDatatable();
    });
    //Implement load datatable
    function refreshDatatable() {
        var oTable = oTable || $('#datatable-sside').DataTable();
        var $itemFilters = $(".datatable-filter-holder .item-filter");
        $.each($itemFilters, function(index, $item) {
            let valueSearch = $($item).val().trim();
            oTable.columns(index + 1).search(valueSearch);
        });
        oTable.draw();
    };
    //Bulk action
    $("#btnBulk").on("click", "", function(e) {
        e.preventDefault();
        var action = $("#slBulk").val(),
            rows = $("#datatable-sside tbody tr"),
            ids = [],
            pageType = $("#datatable-sside").attr("data-type");
        $('input[name="id[]"]', rows).each(function(index, item) {
            if ($(item).prop("checked")) {
                ids.push(item.value);
            }
        });
        if (ids.length <= 0 || action.length <= 0) {
            swal.fire({
                icon: 'warning',
                title: "Bulk action or row is empty",
                showConfirmButton: true
            });
        } else {
            if (pageType === undefined) {
                swal.fire({
                    icon: 'error',
                    title: "No page type exists",
                    showConfirmButton: true
                });
            } else {
                let data = { id: ids, action: action };
                if (action === "delete") {
                    swal.fire({
                        icon: "question",
                        title: `Remove ${ids.length} records?`,
                        text: "It won't be able to revert",
                        showCancelButton: true,
                        confirmButtonText: 'Ok',
                        cancelButtonText: 'Cancel'
                    }).then((result) => {
                        if (result.value) {
                            sendBulkAjax(pageType, data);
                        }
                    });
                } else {
                    sendBulkAjax(pageType, data);
                }
            }
        }
    });
    //Send Bulk Ajax
    function sendBulkAjax(pageType, data) {
        $.ajax({
            type: "POST",
            url: `/${dashboard}/${pageType}/bulk`,
            data: data,
            success: function(data) {
                let icon = (data.code == 1) ? "success" : "success";
                swal.fire({
                    icon: icon,
                    title: data.message,
                    showConfirmButton: true
                }).then(() => {
                    $("#slBulk").prop("selectedIndex", 0);
                    if (data.code == 1) {
                        setTimeout(function() {
                            $('#datatable-sside').DataTable().ajax.reload();
                        }, 100);
                    }
                });
            },
            error: function(error) {
                swal.fire({                    
                    icon: "error",
                    text: error.responseJSON.message,
                    showConfirmButton: true                    
                });
            }
        });
    };
    //Click button delete in datatable
    $("#datatable-sside").on("click", ".btnDTRDelete", function(e) {
        e.preventDefault();
        var url = $(this).attr("href");
        var $row = $(this).closest("tr");
        swal.fire({
            icon: "question",
            title: 'Remove this record?',
            text: "It won't be able to revert",
            showCancelButton: true,
            confirmButtonText: 'Ok',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.value) {
                $.ajax({
                    type: "DELETE",
                    url: url,
                    success: function(data) {
                        var icon = (data.code == 1) ? 'success' : 'warning';
                        swal.fire({
                            icon: icon,
                            title: data.message,
                            showConfirmButton: true
                        }).then(() => {
                            if (data.code == 1) {
                                $row.remove();
                            }
                        })
                    },
                    error: function(error) {
                        swal.fire({                    
                            icon: "error",
                            text: error.responseJSON.message,
                            showConfirmButton: true                            
                        });
                    }
                });
            }
        });
    });
    //Change status boolean column 
    $("#datatable-sside").on("click", ".icon-status", function(e) {
        e.preventDefault();
        var $this = $(this),
            pageType = $this.closest("#datatable-sside").data("type"),
            $dataContainer = $this.closest(".icon-status-wrap"),
            id = $dataContainer.data("id"),
            col = $dataContainer.data("col"),
            inverse = $dataContainer.data("inverse"),
            value = $this.hasClass("fa-toggle-on") ? false : true,            
            title = (value) ? $dataContainer.data("true") : $dataContainer.data("false"),
            rowName = $this.closest("tr").find(".row-name").text() || "";
        value = (inverse) ? !value : value;
        $.ajax({
            type: "PUT",
            url: `/${dashboard}/${pageType}/update/coltoggle/${id}`,
            data: { col: col, value: value },
            success: function(data) {
                let text = `${rowName} ${title.toLowerCase()}`;
                swal.fire({
                    position: 'top-end',
                    icon: 'success',
                    text: text,
                    showConfirmButton: false,
                    timer: 1000
                });
                if (data.code == 1) {
                    $this.toggleClass("fa-toggle-on").toggleClass("fa-toggle-off");
                    $this.attr("title", title);
                }
            },
            error: function(error) {
                swal.fire({                    
                    icon: "error",
                    text: error.responseJSON.message,
                    showConfirmButton: true
                });
            }
        });
    });
    //Change status text column 
    $("#datatable-sside").on("click", ".btn-change-status", function(e) {
        e.preventDefault();
        var $this = $(this),
            pageType = $this.closest("#datatable-sside").attr("data-type"),
            data = {},
            id = $this.attr("data-id"),
            col = $this.attr("data-col"),
            value = $this.attr("data-value");
        data.id = id;
        data.col = col;
        data.value = value;
        $.ajax({
            type: "PUT",
            url: `/${dashboard}/${pageType}/update/status`,
            data: data,
            success: function(data) {
                if (data.code == 1) {
                    refreshDatatable();
                } else {
                    swal.fire({
                        position: 'top-end',
                        icon: "error",
                        text: data.message,
                        showConfirmButton: true
                    })
                }
            },
            error: function(error) {
                swal.fire({                    
                    icon: "error",
                    text: error.responseJSON.message,
                    showConfirmButton: true
                });
            }
        });
    });
    //Load data into modal form edit
    $('#datatable-sside').on("click", ".btn-load-modal-edit", function() {
        var $this = $(this),
            pageType = $this.closest("#datatable-sside").attr("data-type"),
            id = $this.attr("data-id"),
            url = `/${dashboard}/${pageType}/info/${id}`,
            frmUrl = `/${dashboard}/${pageType}/edit`;
        $.ajax({
            type: "GET",
            url: url,
            success: function(data) {
                if (data.code == 1) {
                    var result = Object.keys(data.data).map(function(key) {
                        return [key, data.data[key]];
                    });
                    for (var i = 0; i < result.length; i++) {
                        let item = result[i];
                        var $element = $(`#frmModal #${item[0]}`);
                        var etype = $element.attr("type");
                        if (etype == "checkbox" || etype == "radio") {
                            $element.prop('checked', (JSON.parse(item[1]) == 1) ? true : false);
                        } else {
                            if ($.isArray(item[1])) {
                                var multi = [];
                                item[1].forEach(option => {
                                    multi.push(option.id);
                                });
                                $(`#frmModal #${item[0]}`).val(multi);
                            } else {
                                $(`#frmModal #${item[0]}`).val(item[1]);
                            }
                        }
                    }
                    $("#frmTitleAction") && $("#frmTitleAction").text("Edit");
                    $("#frmModal form").attr("action", frmUrl);
                    $("#frmModal").modal("show");
                } else {
                    swal.fire({                   
                        icon: "error",
                        text: data.message,
                        showConfirmButton: true
                    });
                }
            },
            error: function(error){
                swal.fire({                   
                    icon: "error",
                    text: error.responseJSON.message,
                    showConfirmButton: true
                });
            }
        });
    });
    $('body').on("click", ".btn-load-modal-add", function(e) {
        e.preventDefault();
        var pageType = $("#datatable-sside").attr("data-type"),
            frmUrl = `/${dashboard}/${pageType}/add`;
        $("#frmModal form").attr("action", frmUrl);
        $("#frmModal form")[0].reset();
        $("#frmTitleAction") && $("#frmTitleAction").text("Add")
        $("#frmModal").modal("show");
    })
    //Submit #frmModal form
    $("#frmModal form").submit(function(e) {
        e.preventDefault();
        var $this = $(this),
            url = $this.attr("action");
        $.ajax({
            url: url,
            data: $this.serialize(),
            method: "POST",
            success: function(rs) {
                var icon = "error";
                if (rs.code == 1) {
                    icon = "success";
                    $this.attr("action", url.replace(/\/edit$/g, "/add"));
                    $("#frmModal .error-modal-add").text("");
                    $("#frmModal").modal("hide");
                    $this[0].reset();
                    refreshDatatable();                    
                } else {
                    $("#frmModal .error-modal-add").text(rs.message);
                }
                swal.fire({
                    icon: icon,
                    text: rs.message,
                    showConfirmButton: true
                });
            },
            error: function(error) {
                swal.fire({                    
                    icon: "error",
                    text: error.responseJSON.message,
                    showConfirmButton: true
                });
            }
        });
    });
});