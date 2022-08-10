$('#form-login').submit(function(e) {
    e.preventDefault();
    var url = $(this).attr("action");
    $.ajax({
        type: "POST",
        url: url,
        data: $(this).serialize(),
        success: function(data) {
            if (data.code == 1) {
                location.reload();
            } else {
                $('#error-sms').html('<div class="alert alert-danger" role="alert">' + data.message + '</div>');
            }
        }
    });
});