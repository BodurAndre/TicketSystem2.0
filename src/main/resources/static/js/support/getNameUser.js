document.addEventListener("DOMContentLoaded", function () {
    let usersLoaded = false; // флаг, чтобы не загружать повторно

    $('#select-user').one('click', function () {
        if (!usersLoaded) {
            $.ajax({
                url: '/getDTOUser',
                method: 'GET',
                success: function(data) {
                    // Очищаем список, оставляем только placeholder
                    $('#select-user').find('option:not([disabled])').remove();

                    data.forEach(function(user) {
                        const optionText = `${user.firstName} ${user.lastName} (${user.email})`;
                        const option = new Option(optionText, user.id);
                        $('#select-user').append(option);
                    });

                    usersLoaded = true; // ставим флаг
                },
                error: function (xhr, status, error) {
                    console.error("Error: ", error, status, xhr);
                    showNotification(xhr.responseText, 'error');
                }
            });
        }
    });
});