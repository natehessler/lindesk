window.onload = function() {
    let type, functionList, func = null;
    // Display functions based on deployment type
    $('#d-types').change(() => {
        type = $('#d-types').val();
        functionList = $(`#${type}`);
        functionList.toggleClass("d-none");
        functionList.change(() => {
            func = functionList.val();
            $('#output').val(func);
            $('#description').text(($(`#${type} option:selected`).attr("label")))
        })
    })
    
    // Copy to clipboard
    $('#copy-btn').click(() => {
        $('#output').select();
        document.execCommand("copy");
    })

};
