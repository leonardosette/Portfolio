window.mostrarToastr = {
    sucesso: function (mensagem) {
        if (window.toastr) {
            toastr.success(mensagem);
        } else {
            console.warn("Toastr não está disponível.");
        }
    },
    erro: function (mensagem) {
        if (window.toastr) {
            toastr.error(mensagem);
        } else {
            console.warn("Toastr não está disponível.");
        }
    }
};
