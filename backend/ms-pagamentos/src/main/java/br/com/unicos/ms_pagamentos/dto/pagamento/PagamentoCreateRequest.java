package br.com.unicos.ms_pagamentos.dto.pagamento;

import br.com.unicos.ms_pagamentos.enums.FormaPagamento;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PagamentoCreateRequest(
        @NotNull Long empresaId,
        Long vendaId,
        Long compraId,
        @NotNull @DecimalMin("0.01") BigDecimal valor,
        @NotNull FormaPagamento formaPagamento,
        LocalDate dataVencimento,
        String descricao,
        String observacao
) {
}
