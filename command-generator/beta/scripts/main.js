window.onload = function() {
    // initial state
    let type, functions, command, desc, ns, pod = null;
    let podDiv = $("#pod-name"), namespace = $("#namespace"), check = $("#namespace-check");
    podDiv.hide(), namespace.hide(), check.hide();

    // Display functions based on deployment type
    $('#d-types').change(() => {
        podDiv.hide(), namespace.hide(), check.hide();
        // development type
        type && $(`#${type}`).toggleClass("d-none");
        type = $('#d-types').val();
        type === "t3" ? check.show() : ns=null;
        // display function list based on selected deployment type
        functions = $(`#${type}`);
        functions.toggleClass("d-none");
        // when a function is selected
        functions.change(() => {
            command = functions.val();
            $("#copy-btn").removeClass("d-none")
            // if pod name is required
            if(($(`#${type} option:selected`).attr("pod"))) {
                podDiv.show();
                pod = podDiv.val();
            } else pod = "";
            // display command line
            ns ? $('#output').val(command+pod+" -n "+ns) : $('#output').val(command+pod);
            // display description text
            // desc = ($(`#${type} option:selected`).attr("title"))
            // $('#description').text(desc)
        })
    })

    // when pod name is updated
    podDiv.change(() => {
        pod = podDiv.val();
        ns ? $('#output').val(command+pod+" -n "+ns) : $('#output').val(command+pod);
    })

    // when namespace checkbox is updated
    $("#namespace-box").change(() => {
        $("#namespace-box").is(":checked") ? namespace.show(): namespace.hide();
        !$("#namespace-box").is(":checked") ? ns=null : ns=namespace.val();
    })

    // when namespace is updated
    namespace.change(() => {
        ns = namespace.val();
        $('#output').val(command+pod+" -n "+ns);
    })
    
    // Copy to clipboard
    $('#copy-btn').click(() => {
        $('#output').select();
        document.execCommand("copy");
        $('.alert').addClass("show");
    })

    $('#close').click(() => $('.alert').removeClass("show"));

};
