package br.com.unicos.ms_pagamentos.dto.pagamento;

import br.com.unicos.ms_pagamentos.enums.StatusPagamento;

import java.math.BigDecimal;

public record PagamentoResumoResponse(
        Long id,
        Long empresaId,
        BigDecimal valor,
        StatusPagamento status
) {
}
