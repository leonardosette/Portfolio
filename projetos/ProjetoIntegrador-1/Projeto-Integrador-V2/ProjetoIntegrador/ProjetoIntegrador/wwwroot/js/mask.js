function aplicarMascaraTelefone(input) {
    input.addEventListener('input', function (e) {
        let x = e.target.value.replace(/\D/g, '').slice(0, 11);
        let formatted = x;

        if (x.length >= 2) {
            formatted = `(${x.slice(0, 2)}`;
        }
        if (x.length >= 7) {
            formatted += `) ${x.slice(2, 7)}-${x.slice(7)}`;
        } else if (x.length > 2) {
            formatted += `) ${x.slice(2)}`;
        }

        e.target.value = formatted;
    });
}

function aplicarMascaraCPF(input) {
    input.addEventListener('input', function (e) {
        let v = e.target.value.replace(/\D/g, '').slice(0, 11);
        let formatted = v;

        if (v.length >= 3 && v.length < 6) {
            formatted = `${v.slice(0, 3)}.${v.slice(3)}`;
        } else if (v.length >= 6 && v.length < 9) {
            formatted = `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6)}`;
        } else if (v.length >= 9) {
            formatted = `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9)}`;
        }

        e.target.value = formatted;
    });
}
