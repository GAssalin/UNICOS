package br.com.unicos.ms_pagamentos.dto.pagamento;

import br.com.unicos.ms_pagamentos.enums.FormaPagamento;
import br.com.unicos.ms_pagamentos.enums.StatusPagamento;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record PagamentoUpdateRequest(
        @NotNull @DecimalMin("0.01") BigDecimal valor,
        @NotNull FormaPagamento formaPagamento,
        @NotNull StatusPagamento status,
        LocalDate dataVencimento,
        OffsetDateTime dataPagamento,
        String descricao,
        String observacao
) {
}
